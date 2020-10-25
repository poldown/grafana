package api

import (
	"fmt"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
)

// GET /api/devices/:deviceId
func GetDeviceByID(c *models.ReqContext) Response {
	query := models.GetDeviceByIDQuery{OrgId: c.OrgId, Id: c.Params(":deviceId")}

	if err := bus.Dispatch(&query); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Device not found", err)
		}

		return Error(500, "Failed to get Device", err)
	}

	return JSON(200, &query.Result)
}

// GET /api/devices/serial-number/:serialNumber/code/:code
func GetDeviceBySN(c *models.ReqContext) Response {
	query := models.GetDeviceBySNQuery{OrgId: c.OrgId, SerialNumber: c.Params(":serialNumber"), Code: c.ParamsInt(":code")}

	if err := bus.Dispatch(&query); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Device not found", err)
		}

		return Error(500, "Failed to get Device", err)
	}

	return JSON(200, &query.Result)
}

// GET /api/devices/:deviceId/last-reading
func (hs *HTTPServer) GetDeviceLastReading(c *models.ReqContext) Response {
	datasourceOrgId := setting.RadGreenDataSourceOrgId
	datasourceId := setting.RadGreenDataSourceId
	bucket := setting.RadGreenBucketName
	organization := setting.RadGreenOrganizationName

	deviceId := c.Params(":deviceId")

	js, _ := simplejson.NewJson([]byte(fmt.Sprintf(`{
			"datasourceId": %d,
			"intervalMs": 20000,
			"orgId": %d,
			"options": { 
				"defaultBucket": "%s", 
				"organization": "%s"
			},
			"query": "from(bucket: \"%s\") |> range(start: -1h) |> filter(fn: (r) => r._field == \"value\" and r.device_id == \"%d\") |> last()"
	}`, datasourceId, datasourceOrgId, bucket, organization, bucket, deviceId)))

	queries := []*simplejson.Json{js}

	return hs.QueryMetricsV2(c, dtos.MetricRequest{
		From:    "0",
		To:      "0",
		Queries: queries,
		Debug:   false,
	})
}

// GET /api/devices/:deviceId/sensors/:sensorType
func (hs *HTTPServer) GetDeviceSensorData(c *models.ReqContext) Response {
	datasourceOrgId := setting.RadGreenDataSourceOrgId
	datasourceId := setting.RadGreenDataSourceId
	bucket := setting.RadGreenBucketName + c.Query("bucket_suffix")
	start := "-" + c.Query("duration")
	every := c.Query("every")
	organization := setting.RadGreenOrganizationName

	field := c.Query("series")
	if field != "min" && field != "max" {
		field = "value"
	}

	deviceId := c.Params(":deviceId")
	sensorType := c.Params(":sensorType")

	aggregateQ := ""
	if every != "" {
		aggregateQ = fmt.Sprintf(` |> aggregateWindow(every: %s, fn: mean)`, every)
	}

	js, _ := simplejson.NewJson([]byte(fmt.Sprintf(`{
			"datasourceId": %d,
			"intervalMs": 20000,
			"orgId": %d,
			"options": { 
				"defaultBucket": "%s", 
				"organization": "%s"
			},
			"query": "from(bucket: \"%s\") |> range(start: %s) |> filter(fn: (r) => r._field == \"%s\" and r.device_id == \"%d\" and r._measurement == \"%s\")%s"
	}`, datasourceId, datasourceOrgId, bucket, organization, bucket, start, field, deviceId, sensorType, aggregateQ)))

	queries := []*simplejson.Json{js}

	return hs.QueryMetricsV2(c, dtos.MetricRequest{
		From:    "0",
		To:      "0",
		Queries: queries,
		Debug:   false,
	})
}

// GET /api/devices/search
func (hs *HTTPServer) SearchDevices(c *models.ReqContext) Response {
	perPage := c.QueryInt("perpage")
	if perPage <= 0 {
		perPage = 1000
	}
	page := c.QueryInt("page")
	if page < 1 {
		page = 1
	}

	var userIdFilter int64
	if hs.Cfg.EditorsCanAdmin && c.OrgRole != models.ROLE_ADMIN {
		userIdFilter = c.SignedInUser.UserId
	}

	query := models.SearchDevicesQuery{
		OrgId:        c.OrgId,
		Query:        c.Query("query"),
		Name:         c.Query("name"),
		UserIdFilter: userIdFilter,
		Page:         page,
		Limit:        perPage,
	}

	if err := bus.Dispatch(&query); err != nil {
		return Error(500, "Failed to search Devices", err)
	}

	query.Result.Page = page
	query.Result.PerPage = perPage

	return JSON(200, query.Result)
}

// GET /api/devices/:deviceId/sensors/:sensorType/threshold
func GetDeviceSensorThreshold(c *models.ReqContext) Response {
	query := models.GetDeviceSensorThresholdQuery{OrgId: c.OrgId, DeviceId: c.ParamsInt64(":deviceId"), SensorType: c.Params(":sensorType")}

	if err := bus.Dispatch(&query); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Threshold not found", err)
		}

		return Error(500, "Failed to get Threshold", err)
	}

	return JSON(200, &query.Result)
}

// DELETE /api/devices/:deviceId
func DeleteDeviceByID(c *models.ReqContext) Response {
	query := models.DeleteDeviceCommand{OrgId: c.OrgId, Id: c.Params(":deviceId")}

	if !c.SignedInUser.IsGrafanaAdmin {
		return Error(403, "Access denied", nil)
	}
	if err := bus.Dispatch(&query); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Device not found", err)
		}

		return Error(500, "Failed to delete device", err)
	}

	return Success("Device Deleted")
}

// PUT /api/devices/:deviceId
func UpdateDevice(c *models.ReqContext, cmd models.UpdateDeviceCommand) Response {
	cmd.OrgId = c.OrgId
	cmd.Id = c.Params(":deviceId")

	if !c.SignedInUser.IsGrafanaAdmin {
		return Error(403, "Access denied", nil)
	}
	if err := bus.Dispatch(&cmd); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Device not found", err)
		}

		return Error(500, "Failed to update device", err)
	}

	return Success("Device Updated")
}
