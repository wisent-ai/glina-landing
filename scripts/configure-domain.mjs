#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const domain = "wisent.com";
const host = "glina";
const address = "76.76.21.21";

function credential(id) {
  return execFileSync("stado", ["credentials", "get", id, "--field", "value"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function decode(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

const username = credential("NAMECHEAP_USERNAME");
const apiUser = credential("NAMECHEAP_API_USER");
const apiKey = credential("NAMECHEAP_API_KEY");
const clientIp = credential("NAMECHEAP_CLIENT_IP");
const common = { ApiUser: apiUser, ApiKey: apiKey, UserName: username, ClientIp: clientIp };

async function request(command, params = {}) {
  const query = new URLSearchParams({ Command: command, ...common, ...params });
  const response = await fetch(`https://api.namecheap.com/xml.response?${query}`);
  const text = await response.text();
  if (!response.ok || !text.includes('Status="OK"')) {
    const message = text.match(/<Error[^>]*>([^<]+)<\/Error>/)?.[1] ?? `HTTP ${response.status}`;
    throw new Error(`Namecheap ${command} failed: ${decode(message)}`);
  }
  return text;
}

const current = await request("namecheap.domains.dns.getHosts", { SLD: "wisent", TLD: "com" });
const records = [...current.matchAll(/<host\s+([^>]+?)\s*\/>/gi)].map((match) => {
  const attributes = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map((entry) => [entry[1], decode(entry[2])]));
  return {
    name: attributes.Name,
    type: attributes.Type,
    address: attributes.Address,
    mxPref: attributes.MXPref || "10",
    ttl: attributes.TTL || "1800",
  };
});

const existing = records.find((record) => record.name === host && record.type === "A");
if (existing) {
  existing.address = address;
  existing.ttl = "300";
} else {
  records.push({ name: host, type: "A", address, mxPref: "10", ttl: "300" });
}

const params = { SLD: "wisent", TLD: "com" };
records.forEach((record, index) => {
  const suffix = String(index + 1);
  params[`HostName${suffix}`] = record.name;
  params[`RecordType${suffix}`] = record.type;
  params[`Address${suffix}`] = record.address;
  params[`MXPref${suffix}`] = record.mxPref;
  params[`TTL${suffix}`] = record.ttl;
});

await request("namecheap.domains.dns.setHosts", params);
console.log(`${host}.${domain} -> ${address}`);
