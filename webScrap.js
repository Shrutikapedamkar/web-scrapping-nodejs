const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const Knwl = require('knwl.js');

async function fetchClientData(clientWebsites) {
  const clientData = [];

  for (const website of clientWebsites) {
    try {
      //making a HTTP GET request to 'website' using axios library
      const response = await axios.get(website);
      //response of the request is stored in $ using cheerio library
      const $ = cheerio.load(response.data);

      // Extracting company name
      let companyName = $('title').text().trim();
  
      // Extracting email ID (only the first one)
      const knwlInstance = new Knwl();
      knwlInstance.init(response.data);
      const emails = knwlInstance.get('emails');
      const companyEmail = emails.length > 0 ? emails[0].address : "--";

      // Extracting company address using HTML tags
      const addressSelectors = [
        '.company-address',
        '.address',
        '.company-info',
        '.contact-address', 
      ];
      let companyAddress = "--";

      for (const addressSelector of addressSelectors) {
        const address = $(addressSelector).text().trim();
        if (address) {
          companyAddress = address;
          break;
        } 
      }

      clientData.push({
        websiteUrl: website,
        companyName,
        companyEmail,
        companyAddress,
      });
    } catch (error) {
      console.error(`Error scraping website ${website}: ERROR ${error.message}`);
      clientData.push({
        websiteUrl: website,
        companyName: '--',
        companyEmail: '--',
        companyAddress: '--',
      });
    }
  }

  return clientData;
}


(async () => {
  try {

    // Read all the email address from 'email_addresses.txt'
    const emailAddresses = fs.readFileSync('email_addresses.txt', 'utf8');
    const allEmails = emailAddresses.split('\n');

    const clientWebsites = [];

    for (const email of allEmails) {
      const emailMatch = email.match(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
      if (emailMatch && emailMatch.length >= 2) {
        const webURL = `http://www.${emailMatch[1]}`;
        clientWebsites.push(webURL);
      }
    }

    // Extract company data and print the results
    const getClientData = await fetchClientData(clientWebsites);
    console.log(getClientData);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
})();