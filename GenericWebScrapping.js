const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const Knwl = require('knwl.js');

const phoneRegex = /(\+\d{1,3}\s?(\s\(0\))?|0)(\d{3}\s?\d{3}\s?\d{4}|\d{4}\s?\d{6})(?![0-9])/;
const additionalEmailReg = /[A-Za-z][A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z]{3}|(\.[A-Za-z]{2}){2})/;
const postCodeReg = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})/;
const emailReg = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/;


async function extractCompanyData(websiteURL, emailID) {
    
      try {
        const response = await axios.get(websiteURL);
        const html = response.data;
  
        const companyName = getCompanyName(html, emailID);
        const postcode = getCompanyPostcode(html);
        const address = await getAddressFromPostcode(postcode); 
        const Company_PhoneNumber = getCompanyPhone(html);
  
        console.log("\x1b[1mCompany's Name: \x1b[0m" , companyName);
        console.log("\x1b[1mCompany's Email Address: \x1b[0m", emailID);
        console.log("\x1b[1mCompany's Website: \x1b[0m", websiteURL);
        console.log("\x1b[1mCompany's Contact: \x1b[0m", Company_PhoneNumber);
        getAdditionalEmailID(html);
        console.log("\x1b[1mCompany's Postcode: \x1b[0m", postcode);
        console.log("\x1b[1mCompany's Address: \x1b[0m", address);
        console.log("---------------------------------------------------------");
  
        
      } catch (error) {
        console.error(`Error scraping data from ${website}: ${error.message}`);
        console.log("---------------------------------------------------------");
        
      }
  
      // Adding a small delay between requests to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  function getCompanyName(html, emailDomain) {

    const $ = cheerio.load(html);

    // Define possible selectors for company names
    const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    let companyName = titleTagMatch ? titleTagMatch[1].trim() : 'N/A';
    if (companyName.toLowerCase().includes('home') 
        && companyName.toLowerCase().includes(emailDomain.toLowerCase())) {
      companyName = companyName.replace(/home/gi, '').trim();
    }
    return companyName;

  }
  

  async function getAddressFromPostcode(postcode) {
    try {
      const response = await axios.get(`https://api.postcodes.io/postcodes/${postcode}`);
      const data = response.data;
      if (data.status === 200 && data.result) {
        const { postcode, region, country, admin_district, locality } = data.result; 
        return {
          postcode: postcode,
          region: region,
          country: country,
          admin_district: admin_district,
          locality: locality,
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
  
  
  function getAdditionalEmailID(html) {
     // Using Knwl to find additional email addresses from the web page
     const knwlInstance = new Knwl();
      knwlInstance.init(html);
      const additionalEmails = knwlInstance.get('emails');
      if (additionalEmails.length > 0) {
        console.log('\x1b[1mAdditional Email Addresses:\x1b[01m');
        const uniqueEmailsSet = new Set();
        // Add each email address to the Set and remove duplicates
        additionalEmails.forEach((email) => uniqueEmailsSet.add(email.address));
        uniqueEmailsSet.forEach((email) => console.log(email));
      }
  }
  
  function getCompanyPostcode(html) {
    return extractData(html, postCodeReg);
  }
  
  function getCompanyPhone(html) {
    return extractData(html, phoneRegex);
  }

async function main() {
    try {
  
      const emailAddresses = fs.readFileSync('email_addresses.txt', 'utf8');
      const emailLines = emailAddresses.split(/\r?\n/); 

      for (const emailLine of emailLines) {
        const match = emailLine.match(emailReg);
        if (match && match.length >= 2) {
          const websiteUrl = `http://www.${match[1]}`;
          await extractCompanyData(websiteUrl, emailLine);
        }
      }
    }
    catch (error) {
      console.error(`Error: ${error.message}`);
    }
}
main();
  