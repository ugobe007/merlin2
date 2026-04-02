import urllib.request, json

TOKEN = "AQUYw9mLEHJzwJEJsBvcRyQz1m0WSVpO2SaFMfvnHxg2cl-xbbZBxreHOtyHUiA-obuwsriVAAtPTDVhHl5j0N6s-N_QxgnQR5xuFvqGs4XOgcMjJAdyIMybW1DhHzriePn43duq5QTQDDXIPUJ2U2QOezs45pf0NB8keyxtKglx2oo6JnmrilfJ29XF_mvtvZiSVSR4vo1yDV_JFgyK42NSlXYBPc_AjeseJbAyhxCZbvxhHhGanNnTSQ4FCrdKDCY9LWG-vVcuJC_ecSfc28QIzedqKyr7vGpoNUgcDMFCm2YHlTEVYR9OM-TfIDYsb8RN6V3PqJaD_6dPKpl5SCgY02e59Q"

# ugcPosts API uses urn:li:person:<sub> where sub is from /v2/userinfo
payload = {
    "author": "urn:li:person:6PmTZOYpYO",
    "lifecycleState": "PUBLISHED",
    "specificContent": {
        "com.linkedin.ugc.ShareContent": {
            "shareCommentary": {
                "text": "Test: Merlin Energy BESS TrueQuote is live! https://merlin2.fly.dev #BESS #CleanEnergy #MerlinEnergy"
            },
            "shareMediaCategory": "NONE"
        }
    },
    "visibility": {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
}

data = json.dumps(payload).encode()
headers = {
    "Authorization": "Bearer " + TOKEN,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0"
}

req = urllib.request.Request("https://api.linkedin.com/v2/ugcPosts", data=data, headers=headers, method="POST")

try:
    r = urllib.request.urlopen(req)
    print("Status:", r.status)
    print("Post ID:", r.headers.get("x-restli-id"))
    print("SUCCESS - check LinkedIn!")
except urllib.error.HTTPError as e:
    print("Error:", e.code)
    print(e.read().decode())
