import fs from "fs";
import { construct_logger } from "./logger/logger.ts";
import { ok, err, Result } from "./types/result.ts";
import { some, none, Option } from "./types/option.ts";
import { exec } from "child_process";

const ERROR_CODES = {
  SUCCESS: 0,
  NO_MAC_ADDRESSES: 1,
  NO_WAKEONLAN: 2,
  NO_ARGS: 3
};

async function main(mac_addresses_path: string, log_path: string): Promise<number> {
  let logs = ""; 
  const { error, info } = construct_logger({ "logger": !log_path ? console.log : (message: string) => { logs = logs + message + "\n"; }, "colors_support": log_path == undefined }); 
  info("Wake instantiated");

  info("Reading MAC address file");
  const mac_address_file = read_mac_address_file(mac_addresses_path);
  if(mac_address_file.is_err()) {
    error(mac_address_file.unwrap_err());
    log_path && fs.writeFileSync(log_path, logs);
    return ERROR_CODES.NO_MAC_ADDRESSES;
  }
  info("File read succesfully");

  info("Trying to decode the file");
  const mac_addresses = parse_mac_addresses(mac_address_file.unwrap());
  info("Decoded such MAC addresses:\n\t" + 
    groupArray(mac_addresses, 3)
      .map(array => array.join(" "))
      .join("\n\t")
  );

  info("Checking if `wakeonlan` is installed");
  const wakeonlan_exists = await check_for_wakeonlan();
  if(wakeonlan_exists.is_some()) {
    error("wakeonlan does not exist");
    log_path && fs.writeFileSync(log_path, logs);
    return ERROR_CODES.NO_WAKEONLAN;
  }
  info("`wakeonlan` exists. Continuing");

  info("Running all `wakeonlan` commands now");
  const results = await run_wakeonlan(mac_addresses);
  results.forEach(v => info(`There was an error for MAC address ${v.mac_address}: ${v.error}`));
  info("Finished!");
   
  log_path && fs.writeFileSync(log_path, logs);
  return 0;
}

function read_mac_address_file(path: string): Result<string, string> {
  try {
    return ok(fs.readFileSync(path, "utf-8"));
  } catch(_) {
    return err("Could not read the file with MAC addresses");
  }
}

function groupArray<T>(array: T[], groupSize: number) {
  return Array.from({ length: Math.ceil(array.length / groupSize) }, (v, i) =>
    array.slice(i * groupSize, i * groupSize + groupSize)
  );
}

function parse_mac_addresses(file: string) {
  return file
    .split("\n")
    .filter(line => line.startsWith("MAC Address:"))
    .map(line => line.slice("MAC Address: ".length))
    .map(line => line.slice(0, 18));
}

async function check_for_wakeonlan(): Promise<Option<string>> {
  return new Promise((res) => {
    const command = "wakeonlan --help";

    exec(command, (e) => {
      if(e) res(some(e.message));
      res(none);
    });
  })
}

type WakeOnLanError = { mac_address: string, error: string };

async function run_wakeonlan(mac_addresses: string[]): Promise<WakeOnLanError[]> {
  const promises = mac_addresses.map(addr => run_single_wakeonlan(addr));

  return (await Promise.all(promises))
    .reduce((acc: WakeOnLanError[], v) => v.is_some() ? [...acc, v.unwrap()] : [...acc], []);
}

function run_single_wakeonlan(mac_address: string): Promise<Option<WakeOnLanError>> {
  return new Promise((res, _) => {
    exec(`wakeonlan ${mac_address}`, (e) => {
      if(e) res(some({ mac_address, error: e.message }));
      res(none);
    });
  });  
}

(async() => {
  if(process.argv.length < 3) {
    construct_logger({ "logger": console.log, "colors_support": true }).error("Usage: yarn start <nmap-dump-path> [log-path]");
    process.exit(ERROR_CODES.NO_ARGS);
  }
  const nmap_dump = process.argv[2];
  const log_path = process.argv[3];

  const result_code = await main(nmap_dump, log_path);

  process.exit(result_code);
})();
