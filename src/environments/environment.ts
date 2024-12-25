// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
export const environment = {
  production: false,
  youtube: {
    apiKey: 'AIzaSyCphKwS_UEyA9HjFSKnfkN9DCa3nOiqyEc',
    clientId: '486768354725-rv3rbt4gdma0dv3ob6er4b3f4fhlkfoe.apps.googleusercontent.com',
    maxResults: '20'
  },
  pixabay: {
    apiKey: "45940050-99ae52330212333c7ae132ad2"
  },
  firebase: {
    apiKey: "AIzaSyDJsZsewU5OMusf719Yrq4uIvnFRKlaaXU",
    authDomain: "echoes-player-1bb88.firebaseapp.com",
    projectId: "echoes-player-1bb88",
    storageBucket: "echoes-player-1bb88.appspot.com",
    messagingSenderId: "486768354725",
    appId: "1:486768354725:web:6fd97a03a0fba3262c744c"
  }
};

