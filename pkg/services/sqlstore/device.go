package sqlstore

import (
	"bytes"
	"time"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/models"
)

func init() {
	bus.AddHandler("sql", CreateDevice)
	bus.AddHandler("sql", UpdateDevice)
	bus.AddHandler("sql", DeleteDevice)
	bus.AddHandler("sql", SearchDevices)
	bus.AddHandler("sql", GetDeviceById)
	bus.AddHandler("sql", GetDevicesByOrgId)
	bus.AddHandler("sql", GetDeviceBySN)
	bus.AddHandler("sql", GetDeviceSensorThreshold)
}

func getDeviceSelectSqlBase() string {
	return `SELECT
		device.id as id,
		device.org_id,
		device.serial_number as serial_number,
		device.name as name,
		device.location_gps as location_gps,
		device.location_text as location_text,
		device.floor as floor
		FROM device as device `
}

func CreateDevice(cmd *models.CreateDeviceCommand) error {
	return inTransaction(func(sess *DBSession) error {

		if isNameTaken, err := isDeviceNameTaken(cmd.OrgId, cmd.Name, 0, sess); err != nil {
			return err
		} else if isNameTaken {
			return models.ErrDeviceNameTaken
		}

		device := models.Device{
			Name:         cmd.Name,
			OrgId:        cmd.OrgId,
			SerialNumber: cmd.SerialNumber,
			LocationGPS:  cmd.LocationGPS,
			LocationText: cmd.LocationText,
			Floor:        cmd.Floor,
			Created:      time.Now(),
			Updated:      time.Now(),
		}

		_, err := sess.Insert(&device)

		cmd.Result = device

		return err
	})
}

func UpdateDevice(cmd *models.UpdateDeviceCommand) error {
	return inTransaction(func(sess *DBSession) error {

		if isNameTaken, err := isDeviceNameTaken(cmd.OrgId, cmd.Name, cmd.Id, sess); err != nil {
			return err
		} else if isNameTaken {
			return models.ErrDeviceNameTaken
		}

		device := models.Device{
			Name:         cmd.Name,
			SerialNumber: cmd.SerialNumber,
			LocationGPS:  cmd.LocationGPS,
			LocationText: cmd.LocationText,
			Floor:        cmd.Floor,
			Updated:      time.Now(),
		}

		affectedRows, err := sess.ID(cmd.Id).Update(&device)

		if err != nil {
			return err
		}

		if affectedRows == 0 {
			return models.ErrDeviceNotFound
		}

		return nil
	})
}

func DeleteDevice(cmd *models.DeleteDeviceCommand) error {
	return inTransaction(func(sess *DBSession) error {
		if _, err := deviceExists(cmd.OrgId, cmd.Id, sess); err != nil {
			return err
		}

		deletes := []string{
			"DELETE FROM device WHERE org_id=? and id = ?",
		}

		for _, sql := range deletes {
			_, err := sess.Exec(sql, cmd.OrgId, cmd.Id)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func deviceExists(orgId int64, deviceId int64, sess *DBSession) (bool, error) {
	if res, err := sess.Query("SELECT 1 from device WHERE org_id=? and id=?", orgId, deviceId); err != nil {
		return false, err
	} else if len(res) != 1 {
		return false, models.ErrDeviceNotFound
	}

	return true, nil
}

func isDeviceNameTaken(orgId int64, name string, existingId int64, sess *DBSession) (bool, error) {
	var device models.Device
	exists, err := sess.Where("org_id=? and name=?", orgId, name).Get(&device)

	if err != nil {
		return false, nil
	}

	if exists && existingId != device.Id {
		return true, nil
	}

	return false, nil
}

func SearchDevices(query *models.SearchDevicesQuery) error {
	query.Result = models.SearchDeviceQueryResult{
		Devices: make([]*models.DeviceDTO, 0),
	}
	queryWithWildcards := "%" + query.Query + "%"

	var sql bytes.Buffer
	params := make([]interface{}, 0)

	sql.WriteString(getDeviceSelectSqlBase())
	sql.WriteString(` WHERE device.org_id = ?`)

	params = append(params, query.OrgId)

	if query.Query != "" {
		sql.WriteString(` and device.name ` + dialect.LikeStr() + ` ?`)
		params = append(params, queryWithWildcards)
	}

	if query.Name != "" {
		sql.WriteString(` and device.name = ?`)
		params = append(params, query.Name)
	}

	sql.WriteString(` order by device.name asc`)

	if query.Limit != 0 {
		offset := query.Limit * (query.Page - 1)
		sql.WriteString(dialect.LimitOffset(int64(query.Limit), int64(offset)))
	}

	if err := x.SQL(sql.String(), params...).Find(&query.Result.Devices); err != nil {
		return err
	}

	device := models.Device{}
	countSess := x.Table("device")
	if query.Query != "" {
		countSess.Where(`name `+dialect.LikeStr()+` ?`, queryWithWildcards)
	}

	if query.Name != "" {
		countSess.Where("name=?", query.Name)
	}

	count, err := countSess.Count(&device)
	query.Result.TotalCount = count

	return err
}

func GetDeviceById(query *models.GetDeviceByIdQuery) error {
	var sql bytes.Buffer

	sql.WriteString(getDeviceSelectSqlBase())
	sql.WriteString(` WHERE device.org_id = ? and device.id = ?`)

	var device models.DeviceDTO
	exists, err := x.SQL(sql.String(), query.OrgId, query.Id).Get(&device)

	if err != nil {
		return err
	}

	if !exists {
		return models.ErrDeviceNotFound
	}

	query.Result = &device
	return nil
}

func GetDevicesByOrgId(query *models.GetDevicesByOrgIdQuery) error {
	query.Result = make([]*models.DeviceDTO, 0)

	var sql bytes.Buffer

	sql.WriteString(getDeviceSelectSqlBase())
	sql.WriteString(` WHERE device.org_id = ?`)

	err := x.SQL(sql.String(), query.OrgId).Find(&query.Result)
	return err
}

func GetDeviceBySN(query *models.GetDeviceBySNQuery) error {
	var sql bytes.Buffer

	sql.WriteString(getDeviceSelectSqlBase())
	sql.WriteString(` WHERE device.org_id = ? and device.serial_number = ?`)

	var device models.DeviceDTO
	exists, err := x.SQL(sql.String(), query.OrgId, query.SerialNumber).Get(&device)

	if err != nil {
		return err
	}

	if !exists {
		return models.ErrDeviceNotFound
	}

	query.Result = &device
	return nil
}

func GetDeviceSensorThreshold(query *models.GetDeviceSensorThresholdQuery) error {
	var sql bytes.Buffer

	sql.WriteString(`(SELECT t1.id as id,
						t1.org_id as org_id, 
						t1.device_id as device_id,
						t1._measurement as _measurement,
						t1.type as type,
						t1.data as data
						FROM threshold as t1
						WHERE t1.device_id = ? AND t1._measurement = ? and t1.is_default = 0
					) UNION (SELECT t2.id as id,
						? as org_id,
						? as device_id,
						t2._measurement as _measurement,
						t2.type,
						t2.data
						FROM threshold as t2
						WHERE t2._measurement=? and t2.is_default = 1
					) LIMIT 1`)

	var threshold models.ThresholdDTO
	exists, err := x.SQL(sql.String(), query.DeviceId, query.SensorType, query.OrgId, query.DeviceId, query.SensorType).Get(&threshold)

	if err != nil {
		return err
	}

	if !exists {
		return models.ErrThresholdNotFound
	}

	query.Result = &threshold
	return nil
}
