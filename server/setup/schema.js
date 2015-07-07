var Schema = {
    Translations: {
        fields: {
            id: {type: 'increments',  primary: true},
            fromLang: {type: 'string', maxlength: 4, nullable: false },
            toLang: {type: 'string', maxlength: 4, nullable: false },
            translate: {type: 'string',nullable: false },
            transcription: {type: 'string', nullable: true},
            mainResult: {type: 'string', nullable: false },
            rawResult: {type: 'text', nullable: false },
            provider: {type: 'string', maxlength: 4, nullable: false },
            insertTime: {type: 'timestamp', defaultToRaw: 'now()'}
        },
        constrains: {
            uniques: [['fromLang','toLang','translate']]
        }
    },
    Users: {
        fields: {
            id: {type: 'increments',  primary: true},
            name: {type: 'string'},
            email: {type: 'string',index: 'btree'},
            cryptedPassword: {type: 'string'},
            token: {type: 'string',index: 'btree'},
            isAdmin: {type: 'boolean', defaultTo: false},
            createdAt: {type: 'timestamp', defaultToRaw: 'now()'},
            updatedAt: {type: 'timestamp', defaultToRaw: 'now()'}
        },
        constrains: {
            uniques: [['email']]
        }
    },
    UserTranslations: {
        fields: {
            id: {type: 'increments',  primary: true},
            userId: {type: 'integer',  unsigned: true, references: 'Users.id',onDelete:'CASCADE'},
            translationId: {type: 'integer',  unsigned: true, references: 'Translations.id',onDelete:'CASCADE'},
            translate: {type: 'string', nullable: false },
            insertTime: {type: 'timestamp', defaultToRaw: 'now()'}
        },
        constrains: {
            uniques: [['userId', 'translationId']]
        }
    },
    UserTranslationsSamples: {
        fields: {
            id: {type: 'increments',  primary: true},
            userId: {type: 'integer',  unsigned: true, references: 'Users.id',onDelete:'CASCADE'},
            translationId: {type: 'integer',  unsigned: true, references: 'Translations.id',onDelete:'CASCADE'},
            sample: {type: 'string' }
        },
        constrains: {
            uniques: [['userId', 'translationId', 'sample']]
        }
    },
    UserLanguages: {
        fields: {
            id: {type: 'increments',  primary: true},
            userId: {type: 'integer',  unsigned: true, references: 'Users.id',onDelete:'CASCADE'},
            fromLang: {type: 'string', maxlength: 4},
            toLang: {type: 'string', maxlength: 4},
            prefered: {type: 'json', nullable: true}
        },
        constrains: {
            uniques: [['userId']]
        }
    }
};

module.exports = Schema;
