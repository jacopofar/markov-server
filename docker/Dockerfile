#use alpine to reduce size? for now, there are certificate issues
#with jxcore there's no Buffer.compare, waiting for issue discussion to decide what to do
#there's also node v4.0
FROM phusion/baseimage:0.9.16
RUN curl -sL https://deb.nodesource.com/setup_iojs_2.x | sudo bash -
RUN apt-get update && apt-get install -y wget iojs build-essential python

RUN wget https://github.com/jacopofar/markov-server/archive/0.1.tar.gz && tar -xzvf 0.1.tar.gz
RUN cd markov-server-0.1 && npm install
CMD ["node", "/markov-server-0.1/index.js"]
