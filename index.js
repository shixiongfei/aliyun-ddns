"use strict";

const Core = require('@alicloud/pop-core');
const request = require('request');
const CronJob = require('cron').CronJob;

const accessKeyId = '<accessKeyId>';
const accessKeySecret = '<accessSecret>';
const regionId = "cn-shanghai";
const domains = [
  {
    domain: "example.com",
    subdomain: ['@', '*']
  }
];

function getIP() {
  return new Promise((resolve, reject) => {
    request('https://shixiongfei.com/api/getip', (error, response, body) => {
      if (!error && response.statusCode == 200)
        resolve(body);
      else
        reject(error);
    });
  });
}

function getRecords(api, domain) {
  return api.request('DescribeDomainRecords', {
    RegionId: regionId,
    DomainName: domain
  }, {
    method: 'POST'
  });
}

function updateRecord(api, record, ip) {
  return api.request('UpdateDomainRecord', {
    RegionId: regionId,
    RecordId: record.RecordId,
    RR: record.RR,
    Type: record.Type,
    Value: ip
  }, {
    method: 'POST'
  });
}

async function DDNS() {
  try {
    let client = new Core({
      accessKeyId: accessKeyId,
      accessKeySecret: accessKeySecret,
      endpoint: 'https://alidns.aliyuncs.com',
      apiVersion: '2015-01-09'
    });
    let ip = await getIP();

    domains.forEach(async (domain) => {
      let records = await getRecords(client, domain.domain);

      records.DomainRecords.Record.forEach(async (record) => {
        if (!domain.subdomain.includes(record.RR))
          return;

        if (record.Value == ip)
          return;

        await updateRecord(client, record, ip);
        console.log(`${record.RR}.${record.DomainName} - ${record.Type}: ${ip}`);
      });
    });
  } catch (e) {
    console.log(e);
  }
}

new CronJob('0 */5 * * * *', DDNS).start();
