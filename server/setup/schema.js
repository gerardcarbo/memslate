var Schema = {
    Translations: {
        fields: {
            id: {type: 'increments', nullable: false, primary: true},
            fromLang: {type: 'string', maxlength: 2, nullable: false },
            toLang: {type: 'string', maxlength: 2, nullable: false },
            translate: {type: 'string',nullable: false },
            transcription: {type: 'string', nullable: true},
            mainResult: {type: 'string', nullable: false },
            rawResult: {type: 'text', nullable: false },
            provider: {type: 'string', maxlength: 2, nullable: false },
            insertTime: {type: 'timestamp', defaultToRaw:'now()'}
        },
        constrains: {
            uniques: [['fromLang','toLang','translate']]
        }
    },
    Users: {
        fields: {
            id: {type: 'increments', nullable: false, primary: true},
            name: {type:'string'},
            email: {type:'string',index:'btree'},
            cryptedPassword: {type:'string'},
            token: {type:'string',index:'btree'},
            isAdmin: {type:'boolean', defaultTo:false},
            createdAt: {type: 'timestamp', defaultToRaw:'now()'},
            updatedAt: {type: 'timestamp', defaultToRaw:'now()'}
        },
        constrains: {
            uniques: [['email']]
        }
    },
    UserTranslations: {
        fields: {
            id: {type: 'increments', nullable: false, primary: true},
            userId: {type: 'integer', nullable: false, unsigned: true},
            translationId: {type: 'integer', nullable: false, unsigned: true}
        },
        constrains: {
            uniques: [['userId', 'translationId']]
        }
    },
    UserTranslationsSamples: {
        fields: {
            id: {type: 'increments', nullable: false, primary: true},
            userId: {type: 'integer', nullable: false, unsigned: true},
            translationId: {type: 'integer', nullable: false, unsigned: true},
            sample: {type: 'string', nullable: false }
        },
        constrains: {
            uniques: [['userId', 'translationId', 'sample']]
        }
    }
};

module.exports = Schema;