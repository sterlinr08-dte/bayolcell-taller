import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image
MODULE=Path(__file__).resolve().parents[2]/'tools/ai-board/build_photo_pyramid.py'
spec=importlib.util.spec_from_file_location('pyramid',MODULE);pyramid=importlib.util.module_from_spec(spec);spec.loader.exec_module(pyramid)
class PyramidTest(unittest.TestCase):
 def test_original_pixels_retained_and_complete_levels(self):
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder);source=path/'qa.png';photo=Image.new('RGB',(513,257),(12,34,56));photo.putpixel((512,256),(255,2,80));photo.save(source)
   m=pyramid.build(source,path/'tiles','iPhone X','QA-NOT-REAL','QA fixture','Test only','Internal test')
   self.assertEqual((m['width'],m['height'],m['maxLevel']),(513,257,10))
   last=Image.open(path/'tiles/tiles/10/2_1.png');self.assertEqual(last.size,(1,1));self.assertEqual(last.getpixel((0,0)),(255,2,80))
   self.assertEqual(json.loads((path/'tiles/manifest.json').read_text())['originalSHA256'],m['originalSHA256'])
   for level in range(11):self.assertTrue((path/f'tiles/tiles/{level}/0_0.png').exists())
   with self.assertRaises(ValueError):pyramid.build(source,path/'tiles','iPhone X','QA','t','l','r')
 def test_missing_provenance_rejected_before_creating_output(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder);Image.new('RGB',(10,10)).save(p/'p.png')
   with self.assertRaises(ValueError):pyramid.build(p/'p.png',p/'out','iPhone X','','title','license','reference')
   self.assertFalse((p/'out').exists())
if __name__=='__main__':unittest.main()
