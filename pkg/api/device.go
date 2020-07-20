package api

import (
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/models"
)

// GET /api/devices/:deviceId
func GetDeviceByID(c *models.ReqContext) Response {
	query := models.GetDeviceByIdQuery{OrgId: c.OrgId, Id: c.ParamsInt64(":deviceId")}

	if err := bus.Dispatch(&query); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Device not found", err)
		}

		return Error(500, "Failed to get Device", err)
	}

	return JSON(200, &query.Result)
}

// GET /api/devices/serial-number/:serialNumber
func GetDeviceBySN(c *models.ReqContext) Response {
	query := models.GetDeviceBySNQuery{OrgId: c.OrgId, SerialNumber: c.Params(":serialNumber")}

	if err := bus.Dispatch(&query); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Device not found", err)
		}

		return Error(500, "Failed to get Device", err)
	}

	return JSON(200, &query.Result)
}

// GET /api/datasources/name/:name/devices/last-reading/:deviceId
func GetDeviceLastReading(c *models.ReqContext) Response {
	query := models.GetDeviceLastReadingQuery{OrgId: c.OrgId, Id: c.ParamsInt64(":deviceId")}

	if err := bus.Dispatch(&query); err != nil {
		if err == models.ErrDeviceNotFound {
			return Error(404, "Device not found", err)
		}

		return Error(500, "Failed to get Device", err)
	}

	return JSON(200, &query.Result)
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
