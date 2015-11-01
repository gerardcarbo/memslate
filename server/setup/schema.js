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
            isAdmin: {type: 'boolean', defaultTo: false},
            createdAt: {type: 'timestamp', defaultToRaw: 'now()'},
            updatedAt: {type: 'timestamp', defaultToRaw: 'now()'}
        },
        constrains: {
            uniques: [['email']]
        }
    },
    UserSessions: {
        fields: {
            id: {type: 'increments',  primary: true},
            token: {type: 'string',index: 'btree'},
            userId: {type: 'integer',  unsigned: true, references: 'Users.id', onDelete:'CASCADE',index: 'btree'},
            accessedAt: {type: 'timestamp', defaultToRaw: 'now()'},
            updatedAt: {type: 'timestamp', defaultToRaw: 'now()'}
        }
        ,
        constrains: {
            uniques: [['token']]
        }
    },
    UserTranslations: {
        fields: {
            id: {type: 'increments',  primary: true},
            userId: {type: 'integer',  unsigned: true, references: 'Users.id',onDelete:'CASCADE'},
            translationId: {type: 'integer',  unsigned: true, references: 'Translations.id',onDelete:'CASCADE'},
            userTranslationInsertTime: {type: 'timestamp', defaultToRaw: 'now()'}
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
    },
    Games: {
        fields: {
            id: {type: 'increments',  primary: true},
            name_id: {type: 'string'},
            name: {type: 'string', nullable: false },
            description: {type: 'string', nullable: false }
        }
        ,
        constrains: {
            uniques: [['id'],['name_id'],['name']]
        }
    }
};

module.exports = Schema;
