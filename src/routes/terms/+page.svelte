<script>
  import { marked } from 'marked'
  import Metatags from '$lib/components/Metatags.svelte';

  const text = `
# Terms of Service
## Usage of Service

**Eligibility:** If you are under eighteen (18) years of age, you may use the Service with the involvement and consent of a parent, legal guardian, or at the direction of your school. Your school may impose additional policies regarding the use of the Service, with which you must comply.

If you open an account to provide the Service to students in a school, you represent and warrant that you are an authorized representative of the school with the authority to bind the school to this Agreement, and that you agree to this Agreement on the school's behalf. If you contact Us to take any action with respect to an account, you represent and warrant that you have all necessary authority to request such action(s) from or on behalf of the account-holder (e.g., a School).

**User Accounts:** In order to use certain features of the Service, you may need to create a user account. You are responsible for maintaining the confidentiality of your account information. You agree to provide accurate and complete information when creating an account and to update your information promptly if any changes occur. You are solely responsible for all activities that occur under your account.

**Acceptable Use:** You agree to use the Service only for lawful purposes and in compliance with all applicable laws, regulations, and these Terms. You will not engage in any activity that interferes with or disrupts the Service or its associated networks.

## Fair Use Policy
Our free unlimited plan is designed to provide generous and flexible usage for typical personal or educational needs. However, to ensure fair access and quality service for all users, we reserve the right to enforce a Fair Use Policy.

**Prohibited Usage:** You may not use the unlimited plan in a way that places excessive demand on our resources, disrupts service for other users, or violates any applicable laws or regulations. This includes but is not limited to automated, excessive, or abusive usage patterns.

**Determination of Fair Use:** We may monitor usage patterns to prevent misuse. If we determine, at our sole discretion, that your usage is excessive or unreasonable compared to typical usage levels, we may take appropriate action, including throttling speeds, imposing limits, or suspending your account.

**Right to Modify or Terminate:** We reserve the right to modify, suspend, or terminate your access to the unlimited plan if we determine that you are abusing the service or violating this Fair Use Policy.

## Intellectual Property

**Ownership:** The Service, including all content, features, and functionality, is owned by US and protected by intellectual property laws. You acknowledge and agree that We retain all rights, title, and interest in and to the Service and its content.

**Limited License:** Subject to your compliance with these Terms, We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for its intended purposes. You may not reproduce, distribute, modify, or create derivative works of the Service without our prior written consent.

**Feedback:** If you choose to provide feedback, suggestions, or ideas regarding the Service ("Feedback"), you grant Us a non-exclusive, worldwide, perpetual, irrevocable, royalty-free, sublicensable right to use, copy, modify, distribute, display, and perform the Feedback for any purpose without any obligation or compensation to you.

## Privacy

Privacy Policy: Your use of the Service is also subject to our Privacy Policy. By using the Service, you consent to the collection, use, and disclosure of your personal information as described in the Privacy Policy. You may view the Privacy Policy at classmate.app/privacy.

## Limitation of Liability

**Disclaimer:** The Service is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the Service, including its accuracy, reliability, or availability. We disclaim all warranties to the fullest extent permitted by law.

**Limitation of Liability:** In no event shall We be liable for any direct, indirect, incidental, consequential, special, or punitive damages, whether in contract, tort (including negligence), or otherwise, arising out of or in connection with your use of the Service.

## Indemnification

You agree to indemnify, defend, and hold harmless Us and Our affiliates, directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses, including reasonable attorneys' fees, arising out of or in connection with your use of the Service or your violation of these Terms.

## Governing Law

These Terms shall be governed by and construed in accordance with the laws of California, without regard to its conflict of law provisions. Any legal action or proceeding arising out of or relating to these Terms or the Service shall be brought exclusively in the state of California.

## Changes to Terms

We reserve the right to modify or replace these Terms at any time. We will notify you of any material changes by posting the updated Terms on the Service or through other communication methods. By continuing to use the Service after such modifications, you agree to be bound by the revised Terms.

## Definitions

For the purposes of these Terms:

Account means a unique account created for You to access our Service or parts of our Service.

Company (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Classmate.

Personal Data is any information that relates to an identified or identifiable individual.

Service refers to the Website.

Usage Data refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).

Website refers to Classmate, accessible from classmate.app.

You means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable. This Service may be purchased by providers of educational services, such as schools, school districts, or teachers that use our services for educational purposes.

**Last Updated:** March 11th, 2025
  `
</script>

<Metatags title="Terms of Service"/>

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