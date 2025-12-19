import mongoose from "mongoose";

const masterSchema = new mongoose.Schema({

    department : {
        type : String,
        required : true
    },
    categoryId : {
        type : Number,
        required : true
    },
    ModuleId : {
        type : Number,
        required : true
    },
    categoryName : {
        type : String,
        required : true
    },
    moduleName : {
        type : String,
        required : true
    },
    severity : {
        type : String,
        required : false
    },
    priority : {
        type : String,
        required : true
    },
    expected_SLA : {
        type : Number,
        required : true
    }
})

masterSchema.index(
  { department: 1, categoryName: 1, moduleName: 1 },
  { unique: true }
);

const TicketMaster = mongoose.model("TicketMaster",masterSchema)
export default TicketMaster