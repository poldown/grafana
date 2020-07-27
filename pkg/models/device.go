package models

import (
	"errors"
	"time"

	geo "github.com/kellydunn/golang-geo"
)

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

	LocationGPS  geo.Point `json:"locationGPS"`
	LocationText string    `json:"locationText"`

	Floor string `json:"floor"`
}

// ---------------------
// COMMANDS

type CreateDeviceCommand struct {
	Name         string    `json:"name" binding:"Required"`
	SerialNumber string    `json:"serialNumber"`
	OrgId        int64     `json:"-"`
	LocationGPS  geo.Point `json:"locationGPS"`
	LocationText string    `json:"locationText"`
	Floor        string    `json:"floor"`

	Result Device `json:"-"`
}

type UpdateDeviceCommand struct {
	Id           int64
	Name         string    `json:"name" binding:"Required"`
	SerialNumber string    `json:"serialNumber"`
	OrgId        int64     `json:"-"`
	LocationGPS  geo.Point `json:"locationGPS"`
	LocationText string    `json:"locationText"`
	Floor        string    `json:"floor"`

	Result Device `json:"-"`
}

type DeleteDeviceCommand struct {
	OrgId int64
	Id    int64
}

type GetDeviceByIdQuery struct {
	OrgId  int64
	Id     int64
	Result *DeviceDTO
}

type GetDeviceBySNQuery struct {
	OrgId        int64
	SerialNumber string
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
	Id           int64     `json:"id"`
	OrgId        int64     `json:"orgId"`
	SerialNumber string    `json:"serialNumber"`
	Name         string    `json:"name"`
	LocationGPS  geo.Point `json:"locationGPS"`
	LocationText string    `json:"locationText"`
	Floor        string    `json:"floor"`
}

type SearchDeviceQueryResult struct {
	TotalCount int64        `json:"totalCount"`
	Devices    []*DeviceDTO `json:"devices"`
	Page       int          `json:"page"`
	PerPage    int          `json:"perPage"`
}

type ThresholdDTO struct {
	Id         int64  `json:"id"`
	OrgId      int64  `json:"orgId"`
	DeviceId   int64  `json:"deviceId"`
	SensorType string `json:"sensorType"`
	Type       int8   `json:"type"`
	Data       string `json:"data"`
}
