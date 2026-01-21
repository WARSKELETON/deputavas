import fs from "fs/promises";
import https from "https";
import zlib from "zlib";
import * as cheerio from "cheerio";

const LIST_URLS = [
  "https://www.parlamento.pt/DeputadoGP/Paginas/deputados.aspx",
  "https://www.parlamento.pt/DeputadoGP/Paginas/Deputados.aspx",
  "https://www.parlamento.pt/DeputadoGP",
];

const BIO_URL = "https://www.parlamento.pt/DeputadoGP/Paginas/Biografia.aspx?BID=";
const PHOTO_URL = "https://app.parlamento.pt/webutils/getimage.aspx?id=";

const OUTPUT_PATH = new URL("../src/data/deputados.json", import.meta.url).pathname;

const REQUEST_HEADERS = {
  "Accept-Encoding": "gzip,deflate,br",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: REQUEST_HEADERS }, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const encoding = res.headers["content-encoding"];
          const finish = (err, data) => {
            if (err) return reject(err);
            resolve(data.toString("utf8"));
          };
          if (encoding === "gzip") {
            zlib.gunzip(buffer, finish);
            return;
          }
          if (encoding === "deflate") {
            zlib.inflate(buffer, finish);
            return;
          }
          if (encoding === "br") {
            zlib.brotliDecompress(buffer, finish);
            return;
          }
          finish(null, buffer);
        });
      })
      .on("error", reject);
  });
}

function postHtml(url, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          ...REQUEST_HEADERS,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const encoding = res.headers["content-encoding"];
          const finish = (err, data) => {
            if (err) return reject(err);
            resolve(data.toString("utf8"));
          };
          if (encoding === "gzip") {
            zlib.gunzip(buffer, finish);
            return;
          }
          if (encoding === "deflate") {
            zlib.inflate(buffer, finish);
            return;
          }
          if (encoding === "br") {
            zlib.brotliDecompress(buffer, finish);
            return;
          }
          finish(null, buffer);
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function findListUrl() {
  for (const url of LIST_URLS) {
    try {
      const html = await fetchHtml(url);
      if (/BID=\d+/.test(html)) {
        return { url, html };
      }
    } catch (error) {
      console.warn(`Failed to fetch list url ${url}:`, error.message);
    }
  }
  throw new Error("No list page contained deputy links.");
}

function extractHiddenFields(html) {
  const $ = cheerio.load(html);
  const fields = {};
  $('input[type="hidden"]').each((_, el) => {
    const name = $(el).attr("name");
    if (!name) return;
    fields[name] = $(el).attr("value") || "";
  });
  return fields;
}

function parsePager(html) {
  const $ = cheerio.load(html);
  const pager = $("#ctl00_ctl51_g_09b23061_9f74_4e04_b904_e22189641946_ctl00_dpgResultsByDate");
  if (!pager.length) return null;

  const current = pager.find("span").first().text().trim();
  const links = [];
  pager.find("a").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href") || "";
    const match = href.match(/__doPostBack\('([^']+)'/);
    if (match) {
      links.push({ text, target: match[1] });
    }
  });
  return { current, links };
}

function toFormBody(fields) {
  return Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

async function postBack(listUrl, html, eventTarget) {
  const fields = extractHiddenFields(html);
  fields.__EVENTTARGET = eventTarget;
  fields.__EVENTARGUMENT = "";
  return postHtml(listUrl, toFormBody(fields));
}

function extractDeputyIds(html) {
  const ids = new Set();
  const regex = /BID=(\d+)/g;
  let match;
  while ((match = regex.exec(html))) {
    ids.add(match[1]);
  }
  return [...ids];
}

function extractListMeta(html) {
  const $ = cheerio.load(html);
  const metaById = new Map();

  $('a[id$="hplNome"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const match = href.match(/BID=(\d+)/);
    if (!match) return;

    const id = match[1];
    const container = $(el).closest(".row.margin_h0.margin-Top-15");
    const party = normalizeText(
      container.find('[id$="lblGP"]').first().text()
    );
    const activityHref =
      container.find('[id$="hplActParlamentar"]').first().attr("href") || "";
    const legislatureMatch = activityHref.match(/lg=([A-Z0-9]+)/i);
    const legislature = legislatureMatch ? legislatureMatch[1] : null;

    metaById.set(id, {
      party: party || null,
      legislature,
    });
  });

  return metaById;
}

async function fetchAllListPages(listUrl, listHtml) {
  const pages = [listHtml];
  let groupHtml = listHtml;
  const seenPageTargets = new Set();
  const seenPageNumbers = new Set();

  const initialPager = parsePager(listHtml);
  if (initialPager?.current) {
    seenPageNumbers.add(initialPager.current);
  }

  while (true) {
    const pager = parsePager(groupHtml);
    if (!pager) break;

    for (const link of pager.links) {
      if (!/^\d+$/.test(link.text)) continue;
      if (seenPageNumbers.has(link.text)) continue;
      seenPageNumbers.add(link.text);
      const pageHtml = await postBack(listUrl, groupHtml, link.target);
      pages.push(pageHtml);
    }

    const nextLink = pager.links.find((link) => link.text === ">");
    if (!nextLink || seenPageTargets.has(nextLink.target)) break;
    seenPageTargets.add(nextLink.target);
    groupHtml = await postBack(listUrl, groupHtml, nextLink.target);
    pages.push(groupHtml);
  }

  return pages;
}

function parseDeputy(html, id, listMetaById) {
  const $ = cheerio.load(html);
  const name =
    normalizeText($('[id$="NomeDeputado"]').first().text()) ||
    normalizeText($("h1").first().text());

  const row = $(".row.Border-Repeater").first();
  const cellsText = row
    .find(".Repeater-Cell, .Repeater-Cell-First")
    .map((_, el) => normalizeText($(el).text()))
    .get();

  const legislature =
    normalizeText(row.find('[id$="txttbgpLegislatura"]').first().text()) ||
    cellsText[0] ||
    listMetaById?.get(id)?.legislature ||
    null;

  const party =
    normalizeText(row.find('[id$="txttbgpSigla"]').first().text()) ||
    cellsText[1] ||
    listMetaById?.get(id)?.party ||
    null;

  return {
    id,
    name: name || null,
    party,
    legislature,
    photoUrl: `${PHOTO_URL}${id}&type=deputado`,
  };
}

async function mapWithConcurrency(items, worker, concurrency = 6) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const slice = items.slice(i, i + concurrency);
    const batch = await Promise.all(
      slice.map(async (item) => {
        try {
          return await worker(item);
        } catch (error) {
          console.warn(`Failed on item ${item}:`, error.message);
          return null;
        }
      })
    );
    results.push(...batch);
  }
  return results;
}

async function main() {
  const { url: listUrl, html: listHtml } = await findListUrl();
  const pages = await fetchAllListPages(listUrl, listHtml);
  const ids = new Set();
  const listMetaById = new Map();
  for (const pageHtml of pages) {
    extractDeputyIds(pageHtml).forEach((id) => ids.add(id));
    const pageMeta = extractListMeta(pageHtml);
    for (const [id, meta] of pageMeta.entries()) {
      if (!listMetaById.has(id)) {
        listMetaById.set(id, meta);
        continue;
      }
      const current = listMetaById.get(id);
      listMetaById.set(id, {
        party: current.party || meta.party,
        legislature: current.legislature || meta.legislature,
      });
    }
  }
  if (!ids.size) {
    throw new Error(`No deputy ids found in ${listUrl}`);
  }

  console.log(`Found ${ids.size} deputy ids from ${listUrl}`);

  const deputies = await mapWithConcurrency([...ids], async (id) => {
    const html = await fetchHtml(`${BIO_URL}${id}`);
    return parseDeputy(html, id, listMetaById);
  });

  const cleanDeputies = deputies
    .filter(Boolean)
    .filter((dep) => dep.name && dep.party && dep.legislature);

  if (!cleanDeputies.length) {
    throw new Error("No deputies parsed successfully.");
  }

  cleanDeputies.sort((a, b) => a.name.localeCompare(b.name, "pt"));

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(cleanDeputies, null, 2), "utf8");
  console.log(`Saved ${cleanDeputies.length} deputies to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
