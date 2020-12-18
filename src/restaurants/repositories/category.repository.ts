import { EntityRepository, Repository } from "typeorm";
import { Category } from "../entities/category.entity";

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {
  async getOrCreate(name: string): Promise<Category> {
    const { categoryName, categorySlug } = this.categoryNamesSlug(name);
    let category = await this.findOne({ slug: categorySlug });

    if (!category) {
      category = await this.save(
        this.create({
          slug: categorySlug,
          name: categoryName,
        })
      );
    }
    return category;
  }

  categoryNamesSlug(name: string): {
    categoryName: string;
    categorySlug: string;
  } {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /gi,'-');
    return {
      categoryName,
      categorySlug,
    }
  }
}