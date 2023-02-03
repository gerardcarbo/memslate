FROM python:3.10.9-slim-bullseye as builder

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq \
  && apt-get -qqq install --no-install-recommends -y pkg-config gcc g++ git\
  && apt-get clean \
  && rm -rf /var/lib/apt

RUN apt-get update && apt-get upgrade --assume-yes

RUN git clone https://github.com/LibreTranslate/LibreTranslate.git app

WORKDIR /app

RUN python -mvenv venv && ./venv/bin/pip install --upgrade pip

# Install package from source code, compile translations
RUN ./venv/bin/pip install Babel==2.11.0 && ./venv/bin/python scripts/compile_locales.py \
  && ./venv/bin/pip install . \
  && ./venv/bin/pip cache purge

FROM python:3.10.9-slim-bullseye

ARG with_models=false
ARG models=""

RUN addgroup --system --gid 1032 libretranslate && adduser --system --uid 1032 libretranslate && mkdir -p /home/libretranslate/.local && chown -R libretranslate:libretranslate /home/libretranslate/.local
USER libretranslate

COPY --from=builder --chown=1032:1032 /app /app
WORKDIR /app

RUN if [ "$with_models" = "true" ]; then  \
  # initialize the language models
  if [ ! -z "$models" ]; then \
  echo 'installing models $models'; \
  ./venv/bin/python -u scripts/install_models.py --load_only_lang_codes "$models";   \
  else \
  echo 'installing ALL models'; \
  ./venv/bin/python -u scripts/install_models.py;  \
  echo 'installing ALL models DONE!'; \
  fi \
  fi

EXPOSE 5000
ENTRYPOINT [ "./venv/bin/libretranslate", "--host", "0.0.0.0" ]
