const  router = require('express') .Router();
const  controllerservice = require('../controllers/serviceController') 



router.get('/',controllerservice.getAllServices);       // GET /api/services
router.post('/',controllerservice.createService);      // POST /api/services
router.post('/', controllerservice.createService);      // POST /api/services
router.get('/:id', controllerservice.getServiceById);   // GET /api/services/:id
router.put('/:id', controllerservice.updateService);    // PUT /api/services/:id
router.delete('/:id', controllerservice.deleteService); // DELETE /api/services/:id

module.exports= router;