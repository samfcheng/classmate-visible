<script>
  import { marked } from 'marked'
  import Metatags from '$lib/components/Metatags.svelte';

  const text = `
# Privacy Policy

At Classmate, we take your privacy seriously. Please read this Privacy Policy to learn how we treat your personal data. By using or accessing our Services in any manner, you acknowledge that you accept the practices and policies outlined below, and you hereby consent that we will collect, use, and share your information as described in this Privacy Policy.

This Privacy Policy covers how we treat Personal Data that we gather when you access or use our Services. “Personal Data” means any information that identifies or relates to a particular individual and also includes information referred to as “personally identifiable information” or “personal information” under applicable data privacy laws, rules, or regulations. This Privacy Policy does not cover the practices of companies we don't own or control or people we don't manage.

## Summary

- We limit the personal information we collect to only what's needed to provide you our Service.
- We only use the information we collect to provide you with the Service.
- We don't rent, sell, or exchange any data to or with anyone.
- We ensure you remain in control of your data.
- We follow industry best practices (including using encryption) to keep your data safe.
- We aim to be as transparent as possible about our data practices. If you have any questions or concerns, please reach out to us.

## Data We Collect

While using Our Service, We may collect personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to: your name, email address, school affiliation, and other relevant contact information. 

## Usage Data

Usage Data is collected automatically when using the Service.

Usage Data may include information such as Your device's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, activity on those pages, unique device identifiers, and other diagnostic data.

When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers, and other diagnostic data.

As of 6/21/25, this data is collected through our service partners PostHog and Vercel.

## How We Use Personal Information

### To Provide and Enhance Our Services:
- We use Personal Data to provide and maintain our services, manage user registrations, and enable access to service functionalities for registered users.
- We provide you with the products, services, or information you request, and manage and fulfill service contracts.
- We offer customer service and respond to requests and feedback.

### To Communicate and Engage with Users:
- We may provide You with updates and announcements, contacting You via email or other electronic communications for updates, security alerts, and information about our services.
- We tailor our service to your preferences, sending communications based on your settings, including informative communications about our products, services, and promotions.

### To do Research and Development:
- We turn personal information into anonymous data for research purposes to improve our services and inform us about new features and usage.

### Legal Compliance and Protection:
- We comply with applicable laws, lawful requests, legal processes, and enforcing our terms and conditions.
- We prevent misuse, including preventing, identifying, investigating, and deterring fraudulent, harmful, unauthorized, unethical, or illegal activities, including cyberattacks and identity theft.

### Retention of Personal Data
Classmate will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.

### Protection of Personal Data

Classmate implements reasonable security measures to protect Personal Data from unauthorized access, disclosure, alteration, or destruction. The Company uses encryption technologies, secure storage, access controls, and regularly updates security practices to safeguard Personal Data.

## How We Share and Disclose Personal Information

We do not, and **will never** rent, sell, or exchange your personal information to any third party and do not engage in advertising with your personal data.

**Vendors and Service Providers:** We engage with trusted third-party service providers for hosting, data analysis, customer support, and other operational functions. These providers only access necessary information and are bound to confidentiality.

**Legal and Governmental Compliance:** We may disclose personal information to law enforcement, government authorities, or private parties to comply with the law or valid legal requests.

**Business Transfers and Partnerships:** In the event of a business transfer such as an acquisition, merger, reorganization, sale of assets, bankruptcy, or dissolution, personal information may be transferred to the new owner. We will endeavor to ensure the new owner adheres to this Privacy Policy.

**Aggregate or De-Identified Information Sharing:** We may share information in aggregated or anonymous forms that cannot reasonably be used to identify individuals.

**Your Consent and Instructions:** We share information with your consent and as per your instructions, including with parents when applicable.

## Your Rights to Data

**Access and Update:** You may access and update Your Personal Data by logging into Your Account. Your name, email, and profile picture are collected from your Google Account.

**Opt-Out:** You may opt-out of receiving non-essential communications from the Company by following the instructions provided in Company communications.

**Deletion:** If You would like the Company to delete Your Personal Data, please contact us using the information provided at the end of this Privacy Policy. However, please note that the Company may be required to retain certain information for legal or legitimate business purposes.

## State Law Privacy Rights

**California:** We will not use your information for purposes other than those indicated in the Terms of Service and this Privacy Policy. We do not use your information for targeted ads, and we do not sell your data.

**Colorado:** We will not use your information for purposes other than those indicated in the Terms of Service and this Privacy Policy. Our privacy and security policies include only providing access to information on an as-needed basis.

**Florida:** In the event of a breach, we will notify you in accordance with the Florida Information Protection Act of 2014.

**Maryland:** We do not use your information for targeted ads.

**Nevada:** We do not sell your Personal Data.

**Pennsylvania:** In the event of a breach, we will notify you in accordance with Pennsylvania's Breach of Personal Information Notification Act.

**Washington:** We will notify you of material changes in this Privacy Policy.

## Changes to this Privacy Policy

The Company may update our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.

## Contact Us

If you have any questions about this Privacy Policy, You can contact us:

By email: hi@classmate.app


## Definitions

For the purposes of this Privacy Policy:

Account means a unique account created for You to access our Service or parts of our Service.

Company (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Classmate.

Personal Data is any information that relates to an identified or identifiable individual.

Service refers to the Website.

Usage Data refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).

Website refers to Classmate, accessible from classmate.app.

You means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable. This Service may be purchased by providers of educational services, such as schools, school districts, or teachers that use our services for educational purposes.

**Last Updated:** June 21st, 2025
  `
</script>

<Metatags title="Privacy Policy"/>

<style>
  .top-page-nav {
    display: flex;
    justify-content: center;
    padding: 4rem 2rem;
  }
  .page-main {
    padding: 2rem 10vw 4rem 10vw;
  }
</style>

<nav class="top-page-nav">
  <a href="../">
    <img src="/logo.svg" alt="Logo"/>
  </a>
</nav>
<main class="page-main">
  {@html marked(text)}
</main>