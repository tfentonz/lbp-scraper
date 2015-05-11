'use strict';

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var morgan = require('morgan');
var url = 'https://lbp.ewr.govt.nz/PublicRegister/View.aspx?lbpid=';

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(morgan('dev'));

app.get('/lbp/:id.json', function (req, res) {
  var lbpId = req.params.id;
  request(url + lbpId, function (err, response, html) {
    if (err) {
      console.log('Request failed ' + err);
      return;
    }
    var $ = cheerio.load(html);
    var lbpNumber, lbpName, lbpLocation, phoneNumber, faxNumber, emailAddress,
      website;
    var companies = [], qualifications = [], endorsements = [];

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
      companies.push($(this).text().replace(/ LTD$/, ' Ltd'));
    });

    // Qualifications.
    $('#ctl00_MainContent_ucLbpDetails_ucQualifications_gvQualifications' +
      ' table tbody tr td').filter(function () {
      qualifications.push($(this).text());
    });

    // Endorsements.
    $('a.endorsementThickBox').filter(function () {
      var a = $(this);
      var tr = a.parent().parent();
      var endorsement = {};
      var dateGranted;
      endorsement.name = a.text();
      endorsement.status_of_licence = tr.children().first().next().text();
      endorsement.status_reason = tr.children().first().next().next().text()
                                    .trim();
      dateGranted = new Date(tr.children().first().next().next().next().text());
      endorsement.date_granted = dateGranted.toISOString().slice(0, 10);
      endorsements.push(endorsement);
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
      endorsements: endorsements,
      _links: {
        self: {
          href: url + lbpId
        }
      }
    });
  });
});

console.log(app.get('port'));

app.listen(app.get('port'), function () {
  console.log('LBP scraper listening on port ' + app.get('port'));
});
