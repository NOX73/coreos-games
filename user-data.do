#cloud-config

coreos:
  etcd:
    discovery: https://discovery.etcd.io/4ba2fe227a952cd3869e57dc6e8b5674
    addr: $private_ipv4:4001
    peer-addr: $private_ipv4:7001
  fleet:
    public-ip: $private_ipv4
    metadata: role=entrypoint
  units:
    - name: etcd.service
      command: start
    - name: fleet.service
      command: start
