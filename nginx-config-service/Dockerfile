# Pull base image.
FROM dockerfile/nodejs

RUN apt-get update
RUN apt-get install -y git golang
RUN cd /tmp/ && git clone https://github.com/coreos/fleet.git && \
  cd fleet && ./build && cp bin/fleetctl /usr/bin/

#VOLUME ["/var/run/docker.sock"]

ADD https://get.docker.io/builds/Linux/x86_64/docker-latest /usr/bin/docker

RUN chmod +x /usr/bin/docker

ADD ./ /tmp

WORKDIR /tmp

CMD ["/bin/bash", "-l", "-c", "npm i && node index.js"]

EXPOSE 80
