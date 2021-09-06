/**
 * Insert application wide common items here
 */

const inProduction = process.env.NODE_ENV === 'production'

const inStaging = process.env.REACT_APP_STAGING === 'true'

const inE2EMode = process.env.REACT_APP_E2E === 'true'

const runningJest = process.env.REACT_APP_JEST === 'true'

const ADMINS = [
  'varisleo',
  'kalleilv',
  'jakousa',
  'mluukkai',
  'keolli',
  'ttiittan',
]

// These courses bypass the starting after 1.9 filter
const INCLUDE_COURSES = new Set([
  'hy-opt-cur-2122-9f78b627-6261-4eb9-91c4-426066b56cef', // MED-200
  'hy-opt-cur-2122-329bfeb5-2c56-450f-b3f5-ff9dbcca8932',
  'hy-CUR-142630573',
  'hy-CUR-135891626', // Avoin ohtu
  'hy-opt-cur-2021-28bce92e-aa01-4be8-832a-ca9df39bbd39', // Ohte
  'hy-CUR-142676412', // Tsoha loppukesä
  'hy-opt-cur-2122-4de68e21-0a84-4888-b7b6-754179c2832f', // MED-31
  'hy-CUR-137486438', // Functional programming I
  'hy-CUR-137486330', // Ohjelmointihaasteita
  'otm-734c4e41-1e8e-427e-9719-e429a7d67326', // Mail mayhem
  'hy-opt-cur-2122-620d7b5e-9e79-4e06-8536-0abb89dcd9cc',
  'hy-CUR-143272788',
  'otm-fb6961f6-f2da-41ef-bb46-5f44a4beba0f',
  'otm-86582366-ef18-41ed-843c-373f7403ae36',
  'otm-cf67095d-cd2b-4867-8674-c0ec2f880dbd',
  'hy-CUR-143015278',
  'otm-c388c9fd-ab9d-4729-a72d-5b50bee092a5',
  'hy-opt-cur-2122-b0d7ae29-aa6d-434b-a814-918fe313d751',
  'hy-CUR-140926147',
  'hy-CUR-142575636',
  'hy-opt-cur-2122-25da8b39-8fc5-4a6d-bbe6-4674e95515bd',
  'hy-opt-cur-2122-8823ab4f-6ac2-4cce-a73e-363ca5fc8c07',
  'hy-CUR-143053416',
  'otm-f55336a1-66f3-4f20-99e8-d7fe5aae69f2',
  'hy-opt-cur-2122-45d583e2-f4a2-48ca-841b-572c7627626f',
  'hy-CUR-143052783',
  'hy-CUR-143003149',
  'otm-d0e87b45-88ba-48b7-a57e-34fc36083ea8',
  'hy-CUR-142257880',
  'hy-CUR-141643798',
  'hy-CUR-142630573',
  'hy-CUR-142441501',
  'hy-opt-cur-2021-7f93a0cf-c849-4280-aeef-3ee2b9bb01fc',
  'hy-cur-test',
  'hy-CUR-142418452',
  'hy-opt-cur-2122-78220cb5-1bad-4b19-88c3-d4d6a45c8a42',
  'hy-CUR-142475480',
  'hy-CUR-142474123',
  'hy-CUR-142485879',
  'hy-CUR-139544848',
  'hy-CUR-140923542',
  'otm-282e2f19-9068-415f-83ef-04d764d7c4e0',
  'hy-CUR-142448538',
  'hy-CUR-142257312',
  'otm-13e738a9-357b-4140-9a03-489a52b28424',
  'hy-CUR-141582651',
  'hy-CUR-141052037',
  'hy-CUR-142476218',
  'hy-CUR-142466819',
  'otm-04332a73-4b5b-4ce8-8e9f-d4fa660fd4ac',
  'hy-CUR-140970934',
  'hy-CUR-142447886',
  'hy-CUR-142429134',
  'hy-CUR-142341147',
  'hy-CUR-135775880',
  'hy-CUR-142440722',
  'hy-CUR-140935083',
  'hy-CUR-142470078',
  'hy-CUR-138171806',
  'hy-CUR-121867643',
  'hy-CUR-139847744',
  'hy-CUR-139847751',
  'hy-CUR-141563340',
  'hy-opt-cur-2122-cc087a40-7bcc-4727-82cc-1c820d252ff7',
  'hy-CUR-142466808',
  'hy-CUR-142469904',
  'hy-CUR-143155996',
  'hy-CUR-142461324',
  'hy-opt-cur-2122-385ee2f4-54e1-47eb-9bbf-0513ea2e8ef5',
  'hy-CUR-141574143',
  'hy-CUR-135724354',
  'hy-CUR-135712910',
  'hy-opt-cur-2122-9aea3940-4a37-420c-b1d6-3adc121ed18d',
  'hy-CUR-143052227',
  'hy-CUR-142881419',
  'hy-CUR-142676005',
  'hy-CUR-142429967',
  'hy-CUR-142483817',
  'hy-CUR-142386325',
  'hy-CUR-142466760',
  'hy-CUR-142456895',
  'hy-CUR-142450214',
  'hy-CUR-142435758',
  'hy-CUR-142417510',
  'hy-CUR-142429868',
  'hy-CUR-142363688',
  'hy-CUR-142342165',
  'hy-CUR-142148938',
  'hy-CUR-142317168',
  'hy-CUR-142426705',
  'hy-CUR-142167674',
  'hy-CUR-141614206',
  'hy-CUR-141543643',
  'hy-CUR-141429434',
  'hy-CUR-141365826',
  'hy-CUR-142483942',
  'hy-opt-cur-2122-6f454a62-2420-4c98-9733-e747e0707234',
  'hy-CUR-140972212',
  'hy-opt-cur-2122-59932b1f-c93b-4872-9e18-a9494a8198cc',
  'hy-CUR-140928019',
  'hy-CUR-141294471',
  'hy-CUR-140257248',
  'hy-opt-cur-2122-8af6f1c5-c379-45f5-84af-fa93425764e5',
  'hy-CUR-141513942',
  'hy-opt-cur-2122-58050e1f-5603-4737-85a7-e3c6025b3f46',
  'hy-CUR-142458156',
  'hy-opt-cur-2122-4de68e21-0a84-4888-b7b6-754179c2832f',
  'hy-CUR-142482144',
  'hy-CUR-143035031',
  'hy-CUR-141105328',
  'hy-CUR-143016265',
  'hy-CUR-142466820',
  'hy-CUR-142448203',
  'hy-opt-cur-2122-292fb027-4591-4db5-b4a3-cc4beb9ee6bd',
  'hy-opt-cur-2122-278afe89-31af-4b72-8cd6-ba511cd400c6',
  'hy-CUR-142458348',
  'hy-CUR-142416858',
  'hy-CUR-141582101',
  'hy-CUR-142212447',
  'hy-CUR-142210549',
  'hy-CUR-142485880',
  'hy-CUR-142447593',
  'hy-CUR-142426594',
  'hy-CUR-143156603',
  'hy-CUR-143135214',
  'hy-CUR-141663305',
  'hy-CUR-136007074',
  'hy-CUR-142418682',
  'hy-CUR-142386271',
  'hy-CUR-140909969',
  'hy-CUR-136001775',
  'hy-CUR-141101952',
  'hy-CUR-135709968',
  'hy-CUR-141600201',
  'hy-CUR-142436685',
  'hy-CUR-142466463',
  'hy-CUR-140991549',
  'hy-CUR-137328300',
  'hy-CUR-137328142',
  'hy-CUR-142429495',
  'hy-CUR-141270870',
])

const basePath = process.env.PUBLIC_URL || ''

const GIT_SHA = process.env.REACT_APP_GIT_SHA || ''

module.exports = {
  inProduction,
  inE2EMode,
  inStaging,
  runningJest,
  basePath,
  GIT_SHA,
  ADMINS,
  INCLUDE_COURSES,
}
