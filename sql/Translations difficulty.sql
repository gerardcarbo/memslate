﻿select translate, "mainResult",difficulty from public."Translations" where difficulty>0.5 and "fromLang"='en' and "toLang"='es'  order by difficulty 