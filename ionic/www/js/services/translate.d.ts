/// <reference path="../typings/tsd.d.ts" />
declare module Translate {
  export class Translation {
    fromLang:string;
    toLang:string;
    translate:string;
    provider:string;
    mainResult:string;
    transcription:string;
    rawResult:string;
  }

  interface Dictionary {
    [index: string]: string;
  }

  export interface UserLanguages {
    fromLang: string;
    toLang: string;
    prefered: string[];
  }

  export class Languages {
    items:Dictionary;
    user:UserLanguages;
  }

  interface ILanguagesProvider {
    getLanguages():Languages;
  }

  interface ILanguagesService extends ILanguagesProvider {
    getLanguage(langId:string):string;
    getUserLanguages():UserLanguages;
  }

  interface ITranslationsProvider {
    detect (text) : ng.IPromise<void>
    translate (fromLang, toLang, text) : ng.IPromise<void>
  }
}
