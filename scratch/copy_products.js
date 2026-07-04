const fs = require('fs');
const path = require('path');

const srcAdd = 'c:\\Users\\LENOVO\\OneDrive\\Documents\\VS\\SBMI\\apps\\admin-dashboard\\src\\pages\\Products\\AddProduct.jsx';
const dstAdd = 'c:\\Users\\LENOVO\\OneDrive\\Documents\\VS\\SBMI\\apps\\customer-web\\src\\pages\\Seller\\SellerAddProduct.jsx';

const srcEdit = 'c:\\Users\\LENOVO\\OneDrive\\Documents\\VS\\SBMI\\apps\\admin-dashboard\\src\\pages\\Products\\EditProduct.jsx';
const dstEdit = 'c:\\Users\\LENOVO\\OneDrive\\Documents\\VS\\SBMI\\apps\\customer-web\\src\\pages\\Seller\\SellerEditProduct.jsx';

// Function to process AddProduct.jsx
function processAdd() {
  let code = fs.readFileSync(srcAdd, 'utf8');

  // String replacements
  code = code.replace(/import '\.\/AddProduct\.css';/g, "import './SellerPages.css';");
  code = code.replace(/adminToken/g, "token");
  code = code.replace(/\/admin\/product\/new/g, "/seller/product/new");
  code = code.replace(/navigate\('\/products'\)/g, "navigate('/seller/products')");
  code = code.replace(/navigate\('\/dashboard'\)/g, "navigate('/seller/dashboard')");
  
  // Custom header / title adjustment if needed
  code = code.replace(/const AddProduct = \(\) => {/g, "const SellerAddProduct = () => {");
  code = code.replace(/export default AddProduct;/g, "export default SellerAddProduct;");

  fs.writeFileSync(dstAdd, code, 'utf8');
  console.log('Processed and copied AddProduct to SellerAddProduct.');
}

// Function to process EditProduct.jsx
function processEdit() {
  let code = fs.readFileSync(srcEdit, 'utf8');

  // String replacements
  code = code.replace(/import '\.\/AddProduct\.css';/g, "import './SellerPages.css';");
  code = code.replace(/adminToken/g, "token");
  code = code.replace(/\/admin\/product\/new/g, "/seller/product/new");
  code = code.replace(/\/admin\/product\//g, "/seller/product/");
  code = code.replace(/navigate\('\/products'\)/g, "navigate('/seller/products')");
  code = code.replace(/navigate\('\/dashboard'\)/g, "navigate('/seller/dashboard')");
  
  code = code.replace(/const EditProduct = \(\) => {/g, "const SellerEditProduct = () => {");
  code = code.replace(/export default EditProduct;/g, "export default SellerEditProduct;");

  fs.writeFileSync(dstEdit, code, 'utf8');
  console.log('Processed and copied EditProduct to SellerEditProduct.');
}

processAdd();
processEdit();
