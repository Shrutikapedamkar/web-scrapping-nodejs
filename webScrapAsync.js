const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const Knwl = require('knwl.js');

function fetchClientData(clientWebsites) {
  const clientData = [];

  const fetchWebsiteData = (website) => {
    return axios.get(website)
      .then((response) => {
        const $ = cheerio.load(response.data);

        const companyName = $('title').text().trim();
        const knwlInstance = new Knwl();
        knwlInstance.init(response.data);
        const emails = knwlInstance.get('emails');
        const emailId = emails.length > 0 ? emails[0].address : '--';

        const addressSelectors = [
          '.company-address',
          '.address',
          '.company-info',
          '.contact-address',
        ];
        let companyAddress = '--';

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
          emailId,
          companyAddress,
        });
      })
      .catch((error) => {
        console.error(`Error scraping data from ${website}: ${error.message}`);
        clientData.push({
          websiteUrl: website,
          companyName: 'N/A',
          emailId: 'N/A',
          companyAddress: 'N/A',
        });
      });
  };

  const promises = clientWebsites.map(fetchWebsiteData);

  return Promise.all(promises)
    .then(() => clientData);
}

function getWebsiteUrls(emails) {
  return emails
    .map((email) => {
      const emailMatch = email.match(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
      return emailMatch ? `http://www.${emailMatch[1]}` : null;
    })
    .filter((website) => website !== null);
}

function main() {
  const emailAddresses = fs.readFileSync('email_addresses.txt', 'utf8');
  const clientWebsites = getWebsiteUrls(emailAddresses);
  fetchClientData(clientWebsites)
    .then((clientData) => {
      console.log(clientData);
    })
    .catch((error) => {
      console.error(`Error: ${error.message}`);
    });
}

main();
