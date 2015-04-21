'use strict';

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var url = 'https://lbp.dbh.govt.nz/PublicRegister/View.aspx?lbpid=';

app.get('/lbp/:id', function (req, res) {
  var lbpId = req.params.id;
  request(url + lbpId, function (err, response, html) {
    if (err) {
      console.log('Request failed ' + err);
      return;
    }
    var $ = cheerio.load(html);
    var lbpNumber, lbpName, lbpLocation, phoneNumber, faxNumber, emailAddress,
      website;
    var companies = [], qualifications = [];

    lbpNumber    = $('#ctl00_MainContent_ucLbpDetails_fkLbpNumber_View').text();
    // Replace line break elements.
    // Replace comma space postcode at end of string.
    lbpLocation  = $('#ctl00_MainContent_ucLbpDetails_fkLocation_View').html()
                     .replace(/<br>/g, '\n')
                     .replace(/,( \d{4})$/, '$1');
    phoneNumber  = $('#ctl00_MainContent_ucLbpDetails_fkPhoneNumber_View')
                     .text();
    faxNumber    = $('#ctl00_MainContent_ucLbpDetails_fkFaxNumber_View').text();
    emailAddress = $('#ctl00_MainContent_ucLbpDetails_fkEmailAddress_View')
                     .text();
    website      = $('#ctl00_MainContent_ucLbpDetails_fkWebsite_View').text();

    $('.formContainer').filter(function () {
      // John Smith - Licensed Building Practitioner
      var txt = $(this).children('h2').text();
      lbpName = txt.slice(0, txt.indexOf(' - '));
    });

    // Companies.
    $('[id^=ctl00_MainContent_ucLbpDetails_ucCompanyInvolvement_rpCompanies' +
      '_ctl]').filter(function () {
      companies.push($(this).text());
    });

    // Qualifications.
    $('#ctl00_MainContent_ucLbpDetails_ucQualifications_gvQualifications' +
      ' table tbody tr td').filter(function () {
      qualifications.push($(this).text());
    });

    res.json({
      lbp_number: lbpId,
      name: lbpName,
      phone_number: phoneNumber || null,
      fax_number: faxNumber || null,
      email_address: emailAddress || null,
      website: website || null,
      location: lbpLocation,
      companies: companies,
      qualifications: qualifications,
      _links: {
        self: {
          href: url + lbpId
        }
      }
    });
  });
});

var port = process.env.PORT || 3000;

app.listen(port);
