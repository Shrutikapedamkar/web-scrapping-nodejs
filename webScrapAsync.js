const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const Company_PhoneNumber = /(\+\d{1,3}\s?(\s\(0\))?|0)(\d{3}\s?\d{3}\s?\d{4}|\d{4}\s?\d{6})(?![0-9])/;
const emailReg = /[A-Za-z][A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z]{3}|(\.[A-Za-z]{2}){2})/;
const postCodeReg = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})/;

async function extractCompanyData(websites) {
  const companyData = [];

  for (const website of websites) {
    try {
      const response = await axios.get(website);
      const html = response.data;

      const companyName = extractCompanyName(html);
      const Company_Email = extractEmailId(html);
      const postcode = extractCompanyAddress(html);
      const address = await getAddressFromPostcode(postcode); // Get address based on postcode
      const Company_PhoneNumber = extractPhoneNumber(html);

      companyData.push({
        websiteUrl: website,
        companyName: companyName,
        Company_Email: Company_Email,
        Company_PostCode: postcode,
        Company_Address: address,
        Company_PhoneNumber: Company_PhoneNumber,
      });
    } catch (error) {
      console.error(`Error scraping data from ${website}: ${error.message}`);
      companyData.push({
        websiteUrl: website,
        companyName: 'N/A',
        Company_Email: 'N/A',
        Company_PostCode: 'N/A',
        Company_Address: 'N/A',
        Company_PhoneNumber: 'N/A',
      });
    }

    // Introduce a small delay between requests to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return companyData;
}

async function getAddressFromPostcode(postcode) {
  try {
    const response = await axios.get(`https://api.postcodes.io/postcodes/${postcode}`);
    const data = response.data;
    if (data.status === 200 && data.result) {
      const { postcode, region, country, admin_district, parish } = data.result; // Use unique names for each variable
      return {
        postcode: postcode,
        region: region,
        country: country,
        admin_district: admin_district,
        parish: parish,
      };
    } else {
      console.error(`Error fetching address for postcode ${postcode}`);
      return 'N/A';
    }
  } catch (error) {
    console.error(`Error fetching address for postcode ${postcode}: ${error.message}`);
    return 'N/A';
  }
}

function extractData(html, regex) {
  const data = html.match(regex);
  return data ? data[0] : 'N/A';
}

function extractCompanyName(html) {
  const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  let companyName = titleTagMatch ? titleTagMatch[1].trim() : 'N/A';
  if (companyName.toLowerCase().includes('home')) {
    companyName = companyName.replace(/home/gi, '').trim();
  }
  return companyName;
}

function extractEmailId(html) {
  return extractData(html, emailReg);
}

function extractCompanyAddress(html) {
  return extractData(html, postCodeReg);
}

function extractPhoneNumber(html) {
  return extractData(html, Company_PhoneNumber);
}

function readEmailAddressesFromFile(filePath) {
  return fs.readFileSync(filePath, 'utf8'); // Explicitly specify the file encoding as 'utf8'
}

async function main() {
  try {
    // Specify the path to the file containing email addresses
    const filePath = 'email_addresses.txt';

    // Read email addresses from the file
    const emailAddresses = readEmailAddressesFromFile(filePath);
    const emailLines = emailAddresses.split(/\r?\n/); // Use regex to split lines to handle both macOS and Windows line endings

    const websites = [];

    for (const emailLine of emailLines) {
      const match = emailLine.match(/^[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/);
      if (match && match.length >= 2) {
        const websiteUrl = `http://www.${match[1]}`;
        websites.push(websiteUrl);
      }
    }

    // Extract company data and print the results
    const results = await extractCompanyData(websites);
    console.log(results);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();
