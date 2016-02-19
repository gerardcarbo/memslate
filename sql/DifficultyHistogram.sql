select width_bucket(difficulty,0,1,100),count(*) from
  public."Translations"
where difficulty>0
group by 1
order by 1;  
