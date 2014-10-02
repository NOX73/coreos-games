package starter

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/coreos/go-etcd/etcd"
	"log"
	"net/http"
	"os/exec"
	"strconv"
	"time"
)

type InspectJson struct {
	NetworkSettings struct {
		Ports map[string][]struct {
			HostIp   string
			HostPort string
		}
	}
}

type ArrInspectJson []InspectJson

type Starter interface {
	Start()
}

func NewStarter() Starter {
	s := &starter{
		etcdClient: etcd.NewClient([]string{}),
	}

	return s
}

type starter struct {
	etcdClient *etcd.Client
}

func (s *starter) Start() {
	http.HandleFunc("/ide", s.httpIDEHandler)
	log.Println("Start listening on :9090")
	http.ListenAndServe(":9090", nil)
}

func (s *starter) httpIDEHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("New client")

	resp, err := s.etcdClient.Get("/ideCounter", false, false)

	if err != nil {
		log.Fatal(err)
	}

	n, err := strconv.Atoi(resp.Node.Value)

	log.Println("IDE ID: ", n)

	if err != nil {
		log.Fatal(err)
	}

	resp, err = s.etcdClient.Set("/ideCounter", strconv.FormatInt(int64(n+1), 10), 0)

	if err != nil {
		log.Fatal(err)
	}

	cmd := exec.Command("fleetctl", "start", fmt.Sprintf("ide@%v.service", n))
	err = cmd.Run()

	if err != nil {
		log.Fatal(err)
	}

	time.Sleep(time.Second)

	err = errors.New("")

	var info, inspect *etcd.Response

	for err != nil {
		info, err = s.etcdClient.Get(fmt.Sprintf("/ide/info/ide_%v", n), false, false)
		time.Sleep(time.Second)
	}

	inspect, err = s.etcdClient.Get(fmt.Sprintf("/ide/inspect/ide_%v", n), false, false)
	if err != nil {
		log.Fatal(err)
	}

	//log.Println(info.Node.Value)
	//log.Println(inspect.Node.Value)

	var isp InspectJson
	var arr ArrInspectJson

	err = json.Unmarshal([]byte(inspect.Node.Value), &arr)

	if err != nil {
		log.Fatal(err)
	}

	isp = arr[0]

	log.Println("Unmar: ", isp)

	var port string

	for k, v := range isp.NetworkSettings.Ports {
		log.Println("port: ", k, v)
		if k == "9000/tcp" {
			port = v[0].HostPort
		}
	}

	//fmt.Fprintf(w, "Redirect to %v:%v", info.Node.Value, port)

	http.Redirect(w, r, fmt.Sprintf("http://%v:%v", info.Node.Value, port), 302)
}
