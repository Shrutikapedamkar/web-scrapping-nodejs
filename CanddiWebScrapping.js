const axios = require('axios');
const cheerio = require('cheerio');
const Knwl = require('knwl.js');

async function getCompanyDetails(email) {
  try {
    //extracting company's url from email
    const domain = email.split('@')[1];
    const websiteUrl = `http://www.${domain}`;
    //fetching the HTML content of the website
    const response = await axios.get(websiteUrl);
    const html = response.data;

    // Cheerio is used to parse the HTML content
    const $ = cheerio.load(html);

    // Extract company information
    const companyName = domain.split('.')[0];
    const addresses = $('span.footer__contact-text').eq(1).text().trim();
    const phoneNumber = extractPhoneNumber(html);

    //Displaying company's information
    console.log('Company Name:', companyName);
    console.log('Company Address:', addresses);
    console.log('Company Phone Number:', phoneNumber);

    // Using Knwl to find additional email addresses from the web page
    const knwlInstance = new Knwl();
    knwlInstance.init(html);
    const additionalEmails = knwlInstance.get('emails');
    if (additionalEmails.length > 0) {
      console.log('Additional Email Addresses:');
      const uniqueEmailsSet = new Set();
      // Add each email address to the Set and remove duplicates
      additionalEmails.forEach((email) => uniqueEmailsSet.add(email.address));
      uniqueEmailsSet.forEach((email) => console.log(email));
    }
  } 
  catch (error) {
    console.error('Error:', error.message);
  }
}

function extractPhoneNumber(html) {
    const phoneRegex = /(\+\d{1,3}\s?(\s\(0\))?|0)(\d{3,4}\s?\d{3,4}\s?\d{3,4})(?![0-9])/;
    const phoneMatches = html.match(phoneRegex);
    return phoneMatches ? phoneMatches[0] : 'N/A';
}

//Main code
const email = "tim@canddi.com";
getCompanyDetails(email);
