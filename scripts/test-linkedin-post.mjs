#!/usr/bin/env node
const TOKEN = 'AQUYw9mLEHJzwJEJsBvcRyQz1m0WSVpO2SaFMfvnHxg2cl-xbbZBxreHOtyHUiA-obuwsriVAAtPTDVhHl5j0N6s-N_QxgnQR5xuFvqGs4XOgcMjJAdyIMybW1DhHzriePn43duq5QTQDDXIPUJ2U2QOezs45pf0NB8keyxtKglx2oo6JnmrilfJ29XF_mvtvZiSVSR4vo1yDV_JFgyK42NSlXYBPc_AjeseJbAyhxCZbvxhHhGanNnTSQ4FCrdKDCY9LWG-vVcuJC_ecSfc28QIzedqKyr7vGpoNUgcDMFCm2YHlTEVYR9OM-TfIDYsb8RN6V3PqJaD_6dPKpl5SCgY02e59Q';

const body = {
  author: 'urn:li:person:6PmTZOYpYO',
  commentary: '🔋 Merlin Energy is live! TrueQuote BESS analysis — bankable battery storage quotes in 60 seconds. NREL-verified pricing, IRA tax credits, NPV/IRR modeling. Try it free: https://merlin2.fly.dev #EnergyStorage #BESS #CleanEnergy #MerlinEnergy',
  visibility: 'PUBLIC',
  distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
  lifecycleState: 'PUBLISHED',
  isReshareDisabledByAuthor: false,
};

const res = await fetch('https://api.linkedin.com/rest/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'LinkedIn-Version': '202501',
    'X-Restli-Protocol-Version': '2.0.0',
  },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Post ID:', res.headers.get('x-restli-id'));
console.log('Body:', text);
if (res.status === 201) console.log('\n✅ SUCCESS — check LinkedIn!');
else console.log('\n❌ Failed');


const postText = '🔋 Merlin Energy is live!\n\nTrueQuote™ BESS analysis — get a bankable battery storage quote in 60 seconds. NREL-verified pricing, IRA tax credits, NPV/IRR modeling.\n\nTry it free: https://merlin2.fly.dev\n\n#EnergyStorage #BESS #CleanEnergy #MerlinEnergy';

// Try the newer /rest/posts API (2022+) which accepts OpenID sub
console.log('Trying newer /rest/posts API...');
const body = {
  author: `urn:li:person:${SUB}`,
  commentary: postText,
  visibility: 'PUBLIC',
  distribution: {
    feedDistribution: 'MAIN_FEED',
    targetEntities: [],
    thirdPartyDistributionChannels: [],
  },
  lifecycleState: 'PUBLISHED',
  isReshareDisabledByAuthor: false,
};

const res = await fetch('https://api.linkedin.com/rest/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': '202304',
  },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Response:', text);
const postId = res.headers.get('x-restli-id');
if (res.status === 201 || postId) {
  console.log('\n✅ Post ID:', postId ?? '(see response)');
  console.log('✅ Check LinkedIn — post is live!');
} else {
  console.log('\n❌ Failed. Status:', res.status);
}
