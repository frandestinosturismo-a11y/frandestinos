import urllib.request,urllib.parse,urllib.error,json,re,time
from pathlib import Path
assets={
 'petropolis-cristal': 'Palácio de Cristal (Petrópolis), Agosto de 2016.jpg',
 'petropolis-cristal-jardim': 'Palácio de Cristal de Petrópolis - vista lateral.jpg',
 'teresopolis-comary': 'Granjacomary.jpg',
 'teresopolis-lago': 'Teresopolis-Comary1.jpg',
 'penedo-finlandia': 'Penedo RJ Brasil - Pequena Finlandia - panoramio.jpg',
 'penedo-vila': 'Penedo RJ Brasil - Pequena Finlandia - panoramio (1).jpg',
 'arraial-pontal': 'Arraial pontal atalaia 1.jpg',
 'arraial-prainhas': 'Prainha Pontal do atalaia Arraial do cabo rj.jpg',
 'paraty-centro': 'RogerioCassimiro Centro Historico Paraty RJ (26278251817).jpg',
 'paraty-ruas': 'Centro Histórico de Paraty - RJ (14042116675).jpg',
 'rio-copacabana': 'Copacabana, Rio de Janeiro.jpg',
 'rio-orla': 'Rio de Janeiro Copacabana-20110505-RM-100139.jpg',
 'rio': 'Cidade Maravilhosa.jpg',
 'petropolis':'Palácio Quitandinha, Petropolis.jpg',
 'teresopolis':'Dedo de Deus - Parque Nacional Serra dos Órgãos - Teresópolis - RJ - Brasil.jpg',
 'penedo':'Ponte em Pequena Finlândia, Penedo, Itatiaia - RJ.jpg',
 'arraial':'Cidade de Arraial do Cabo.jpg',
 'paraty':'Museu de Arte Sacra de Paraty 01.jpg'
}
headers={'User-Agent':'FranTurismoWebsite/1.0 (tourism landing page image attribution)'}
def request_with_retry(req):
 for attempt in range(5):
  try:
   return urllib.request.urlopen(req,timeout=45)
  except urllib.error.HTTPError as error:
   if error.code not in (429,503) or attempt==4: raise
   time.sleep(3*(attempt+1))
def fetch(item):
 key,title=item
 params={'action':'query','format':'json','titles':'File:'+title,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':1920 if key=='rio' else 1280}
 req=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params),headers=headers)
 data=json.load(request_with_retry(req))
 info=next(iter(data['query']['pages'].values()))['imageinfo'][0]
 url=info.get('thumburl',info['url']).split('?')[0]
 path=Path('public/images/'+key+'.jpg')
 if not path.exists():
  body=request_with_retry(urllib.request.Request(url,headers=headers)).read()
  path.write_bytes(body)
 meta=info['extmetadata']
 clean=lambda s:re.sub('<[^>]+>','',s)
 credit={'id':key,'title':title,'author':clean(meta.get('Artist',{}).get('value','Wikimedia Commons')),'license':meta.get('LicenseShortName',{}).get('value',''),'licenseUrl':meta.get('LicenseUrl',{}).get('value',''),'source':info['descriptionurl'],'changes':'Redimensionamento e enquadramento na página.'}
 print(key,path.stat().st_size)
 return credit
credits_path=Path('public/image-credits.json')
credits=json.loads(credits_path.read_text()) if credits_path.exists() else []
known={credit['id'] for credit in credits}
for item in assets.items():
 if item[0] in known and Path('public/images/'+item[0]+'.jpg').exists():continue
 credits.append(fetch(item))
 credits_path.write_text(json.dumps(credits,ensure_ascii=False,indent=2))
 time.sleep(1)
