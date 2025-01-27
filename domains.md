# How to set up Subdomains with Cloudflare and Vercel

This document walks you through the steps to create a subdomain using Cloudflare and Vercel.

## Cloudflare

I'm going to set up the subdomain "app." on Cloudflare.

### Getting to the right page

1. Click on Websites
2. Click on the domain you want to configure a subdomain for
3. Click on DNS
4. Click on Records

### Adding the Subdomain

1. Click Add record
2. Type = CNAME
3. Name = app
4. IPv4 Address = cname.vercel-dns.com

### Congratulaions

You have now set up the app subdomain successfully!

## Vercel

This is where things get an infinitesimally more involved than configuring the subdomain on Cloudflare.

### Create a Vercel Project

For every subdomain that you domain has, you need a separate project on Vercel.

1. Click on Add New...
2. select Project
3. do your thang

### Configuring the Domain

1. Click into the project you want to configure the domain for
2. Click on Settings
3. Click on Domains
4. Type in "app.BLAH.BLAH" into the text input
5. Click Add

All done!