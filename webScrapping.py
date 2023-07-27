import requests
from bs4 import BeautifulSoup

def getCompanyAddress(soup):
    address = soup.find_all(class_=["address", "company-address", "contact-address", "companyinfo"])
    companyAddress = address[0].get_text(strip=True) if address else "N/A"
    return companyAddress

def getPhoneNumber(soup):
    phone = soup.find_all(class_=["phone", "company-phone", "contact-phone"])
    companyPhone = phone[0].get_text(strip=True) if phone else "N/A"
    return companyPhone

def getCompanyInformation(email):
    # Construct the website URL from the email id
    domain_name = email.split('@')[1]
    website_url = "https://" + domain_name
    
    try:
        # Sending HTTP request
        response = requests.get(website_url)

        # check if response status is 200
        if response.status_code == 200:
            # Parsing HTML
            soup = BeautifulSoup(response.content, "html.parser")

            getAddress = getCompanyAddress(soup)
            getPhone = getPhoneNumber(soup)

            email_id = soup.select("a[href^='mailto:']")
            getOtherEmail = [a["href"][7:] for a in email_id]

            print(f"Email: {email}")
            print(f"Website: {website_url}")
            print(f"Company Address: {getAddress}")
            print(f"Company Phone Number: {getPhone}")
            print(f"Other Email Addresses: {', '.join(getOtherEmail)}")
            print("-----------------------")
        else:
            print(f"Email: {email}")
            print("Failed to retrieve data from the website.")
            print("-----------------------")
    except requests.exceptions.RequestException as e:
        print(f"Email: {email}")
        print(f"Failed to connect to the Website. Error: {e}")
        print("-----------------------")

if __name__ == "__main__":
    # Reading email address from the txt file
    with open("email_addresses.txt", "r") as f:
        email_addresses = f.read().splitlines()

    # Process each email address
    for emails in email_addresses:
        getCompanyInformation(emails)
