FROM mkaichen/node-ubuntu

ENV AUD_DIR /usr/src/uni_audio

# Create app directory
RUN mkdir -p $AUD_DIR
WORKDIR $AUD_DIR

# move everything
COPY . $AUD_DIR

EXPOSE 3124

RUN bash setup.sh

CMD [ "npm", "start" ]
