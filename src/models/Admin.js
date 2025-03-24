
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String,enum: ['admin'], default: 'admin' },
    isActive: { type: Boolean, default: true } 

    
  },
  { timestamps: true }
);


// password hasshing before saving
adminSchema.pre("save", async function (next) {
  try{
  if (!this.isModified('password')) return next();

  // this.password = bcrypt.hash(this.password, 10);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
} catch (error) {
  next(error);
}
});
adminSchema.methods.comparePassword  = async function (enteredPassword) {
  try{
  return await bcrypt.compare(enteredPassword, this.password);
} catch (error) {
  throw new Error('Password comparison failed');
}
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
