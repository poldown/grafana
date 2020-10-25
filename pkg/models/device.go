package models

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/twpayne/go-geom"
	"github.com/twpayne/go-geom/encoding/wkb"
)

type MyPoint struct {
	Point     wkb.Point `json:"-"`
	latitude  float64   `json:"latitude"`
	longitude float64   `json:"longitude"`
}

func (m *MyPoint) FromDB(src []byte) error {
	if src == nil {
		return nil
	}
	var srid uint32 = binary.LittleEndian.Uint32(src[0:4])
	err := m.Point.Scan(src[4:])
	m.Point.SetSRID(int(srid))
	m.latitude = m.Point.Coords().X()
	m.longitude = m.Point.Coords().Y()
	//log.Info(fmt.Sprintf("got point from DB: %f, %f", m.Point.Coords().X(), m.Point.Coords().Y()))

	return err
}
func (m *MyPoint) ToDB() ([]byte, error) {
	log.Info(fmt.Sprintf("[ToDB] lat: %f, lng: %f", m.latitude, m.longitude))
	m.Point = wkb.Point{Point: geom.NewPointFlat(geom.XY, []float64{m.latitude, m.longitude})}
	value, err := m.Point.Value()
	if err != nil {
		return nil, err
	}

	buf, ok := value.([]byte)
	if !ok {
		return nil, fmt.Errorf("did not convert value: expected []byte, but was %T", value)
	}

	mysqlEncoding := make([]byte, 4)
	binary.LittleEndian.PutUint32(mysqlEncoding, 4326)
	mysqlEncoding = append(mysqlEncoding, buf...)

	return mysqlEncoding, err
}

func parseFloatIfNeeded(float interface{}) (float64, error) {
	switch float.(type) {
	case string:
		return strconv.ParseFloat(float.(string), 64)
	default:
		return float.(float64), nil
	}
}

func (m *MyPoint) UnmarshalJSON(data []byte) error {
	var js map[string]interface{}
	err := json.Unmarshal(data, &js)
	if err != nil {
		return err
	}

	if m.latitude, err = parseFloatIfNeeded(js["latitude"]); err != nil {
		return err
	}
	if m.longitude, err = parseFloatIfNeeded(js["longitude"]); err != nil {
		return err
	}

	log.Info(fmt.Sprintf("[UnmarshalJSON] lat: %f, lng: %f", m.latitude, m.longitude))

	return nil
}

func (m *MyPoint) MarshalJSON() ([]byte, error) {
	buffer := bytes.NewBufferString("{")
	buffer.WriteString(fmt.Sprintf("\"latitude\": %f, \"longitude\": %f", m.latitude, m.longitude))
	buffer.WriteString("}")
	return buffer.Bytes(), nil
}

// Typed errors
var (
	ErrDeviceNotFound                         = errors.New("Device not found")
	ErrDeviceNameTaken                        = errors.New("Device name is taken")
	ErrNotAllowedToUpdateDevice               = errors.New("User not allowed to update device")
	ErrNotAllowedToUpdateDeviceInDifferentOrg = errors.New("User not allowed to update device in another org")

	ErrThresholdNotFound = errors.New("Threshold not found")
)

// Device model
type Device struct {
	Id           int64  `json:"id"`
	OrgId        int64  `json:"orgId"`
	SerialNumber string `json:"serialNumber"`
	Name         string `json:"name"`

	Created time.Time `json:"created"`
	Updated time.Time `json:"updated"`

	LocationGps  *MyPoint `json:"locationGps"`
	LocationText string   `json:"locationText"`
}

// ---------------------
// COMMANDS

type CreateDeviceCommand struct {
	Name         string   `json:"name" binding:"Required"`
	SerialNumber string   `json:"serialNumber"`
	OrgId        int64    `json:"-"`
	LocationGps  *MyPoint `json:"locationGps"`
	LocationText string   `json:"locationText"`

	Result Device `json:"-"`
}

type UpdateDeviceCommand struct {
	Id           string
	Name         string   `json:"name" binding:"Required"`
	SerialNumber string   `json:"serialNumber"`
	OrgId        int64    `json:"-"`
	LocationGps  *MyPoint `json:"locationGps"`
	LocationText string   `json:"locationText"`

	Result Device `json:"-"`
}

type DeleteDeviceCommand struct {
	OrgId int64
	Id    string
}

type GetDeviceByIDQuery struct {
	OrgId  int64
	Id     string
	Result *DeviceDTO
}

type GetDeviceBySNQuery struct {
	OrgId        int64
	SerialNumber string
	Code         int
	Result       *DeviceDTO
}

type GetDevicesByOrgIdQuery struct {
	OrgId  int64
	Result []*DeviceDTO `json:"devices"`
}

type SearchDevicesQuery struct {
	Query        string
	Name         string
	Limit        int
	Page         int
	OrgId        int64
	UserIdFilter int64

	Result SearchDeviceQueryResult
}

type GetDeviceSensorThresholdQuery struct {
	OrgId      int64
	DeviceId   int64
	SensorType string
	Result     *ThresholdDTO
}

type DeviceDTO struct {
	Id           string   `json:"id"`
	OrgId        int64    `json:"orgId"`
	SerialNumber string   `json:"serialNumber"`
	Name         string   `json:"name"`
	LocationGps  *MyPoint `json:"locationGps"`
	LocationText string   `json:"locationText"`
}

type SearchDeviceQueryResult struct {
	TotalCount int64        `json:"totalCount"`
	Devices    []*DeviceDTO `json:"devices"`
	Page       int          `json:"page"`
	PerPage    int          `json:"perPage"`
}

type ThresholdDTO struct {
	Id         int64            `json:"id"`
	OrgId      int64            `json:"orgId"`
	DeviceId   int64            `json:"deviceId"`
	SensorType string           `json:"sensorType"`
	Type       int8             `json:"type"`
	Data       *simplejson.Json `json:"data"`
}
