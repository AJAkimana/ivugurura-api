export const categoriesTopicQuery = `
select t."categoryId", c."name" as "categoryName", c.slug
from topics t 
inner join categories c 
on t."categoryId" = c.id 
group by t."categoryId", c."name", c.slug
`;
