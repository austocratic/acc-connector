"use strict";

let knex  = require('knex')({
    client: 'mysql',
    debug: false,
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password:process.env.DB_PASS,
        database: 'icracked_new',
        charset : 'utf8mb4',
        dateStrings : true
    },
    pool: { min: 10 , max: 50 }
});


//Get get_scale_parts records from DB
const getRepair = async (id) =>{
    return await knex
        .select('itech_repairs.id', 'itech_repairs.itech_id', 'itech_repairs.program_id', 'device_model.model_name', 'repair_transactions.subtotal','repair_transactions.itech_subtotal','repair_transactions.sales_tax', 'repair_transactions.tip', 'repair_transactions.discount', 'repair_service_tasks_part.part_code', 'get_scale_parts.sku', 'ledger_parts.id as ledger_id', 'dispatch_meta.postal_code')
        .from('itech_repairs')
        .leftJoin('mobile_repair', 'itech_repairs.dispatch_id', 'mobile_repair.id')
        .leftJoin('dispatch_meta', 'mobile_repair.id', 'dispatch_meta.dispatch_id')
        .innerJoin('repair_devices', 'itech_repairs.id', 'repair_devices.repair_id')
        .innerJoin('device_model', 'repair_devices.model_id', 'device_model.model_id')
        .leftJoin('repair_transactions', 'itech_repairs.id', 'repair_transactions.repair_id')
        .leftJoin('repair_service_tasks_part', 'repair_devices.id', 'repair_service_tasks_part.repair_device_id')
        .leftJoin('ledger_parts', 'itech_repairs.id', 'ledger_parts.itech_repair_id')
        .leftJoin('get_scale_parts', 'repair_service_tasks_part.get_scale_part_id', 'get_scale_parts.id')
        .where('itech_repairs.id', id)
        .andWhere('repair_devices.deleted', 0)
};

module.exports = {
    getRepair
};