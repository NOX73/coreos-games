#cloud-config

coreos:
  etcd:
    discovery: https://discovery.etcd.io/a2e153c8ebd65c2e33e5c789812075cd
    addr: $private_ipv4:4001
    peer-addr: $private_ipv4:7001
  fleet:
    public-ip: $private_ipv4
  units:
    - name: etcd.service
      command: start
    - name: fleet.service
      command: start
