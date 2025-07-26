// This file contains configuration variables for the application.

// You can define multiple scraper webhooks here.
// Each one will have a dedicated button in the Scraper Control Panel.
export const SCRAPER_WEBHOOKS = [
  {
    name: 'Zonaprop',
    url: 'https://n8n.juliandavidpr.com/webhook-test/eec2b2b6-d579-45c0-a653-07d6dce2db88'
  },
  // {
  //   name: 'Argenprop',
  //   url: 'YOUR_ARGENPROP_WEBHOOK_URL_HERE'
  // },
];

// This master webhook can be used to trigger a workflow in n8n
// that sequentially runs all other scrapers.
export const MASTER_WEBHOOK = {
  name: 'Todos los Portales',
  url: 'YOUR_MASTER_WEBHOOK_URL_HERE' // Replace with your master n8n webhook
};