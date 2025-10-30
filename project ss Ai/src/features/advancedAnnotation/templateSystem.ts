/**
 * Annotation Template System
 * Implements save/load annotation templates
 */

import { v4 as uuidv4 } from "uuid";
import { AnnotationTemplate, AnnotationLayer, DrawingStyle } from "./types";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import {
  validateString,
  validateRequired,
  validateArray,
} from "../../utils/validation";

export class TemplateSystem {
  private templates: Map<string, AnnotationTemplate> = new Map();
  private defaultStyle: DrawingStyle = {
    strokeColor: "#000000",
    strokeWidth: 2,
    opacity: 1,
  };

  /**
   * Create a new template
   */
  createTemplate(
    name: string,
    description: string,
    layers: AnnotationLayer[],
    tags: string[] = []
  ): AnnotationTemplate {
    name = validateString(name, "name");
    description = validateString(description, "description");
    validateArray(layers, "layers");
    validateArray(tags, "tags");

    const template: AnnotationTemplate = {
      id: uuidv4(),
      name,
      description,
      layers: JSON.parse(JSON.stringify(layers)), // Deep copy
      defaultStyle: { ...this.defaultStyle },
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Save template from current state
   */
  saveTemplate(
    name: string,
    description: string,
    layers: AnnotationLayer[],
    tags: string[] = []
  ): AnnotationTemplate {
    return this.createTemplate(name, description, layers, tags);
  }

  /**
   * Load template
   */
  loadTemplate(templateId: string): AnnotationTemplate {
    templateId = validateString(templateId, "templateId");

    const template = this.templates.get(templateId);
    if (!template) {
      throw new AppError(
        "TEMPLATE_NOT_FOUND",
        `Template ${templateId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    return JSON.parse(JSON.stringify(template)); // Deep copy
  }

  /**
   * Get template by name
   */
  getTemplateByName(name: string): AnnotationTemplate | null {
    name = validateString(name, "name");

    for (const template of this.templates.values()) {
      if (template.name === name) {
        return JSON.parse(JSON.stringify(template));
      }
    }

    return null;
  }

  /**
   * Update template
   */
  updateTemplate(
    templateId: string,
    updates: Partial<AnnotationTemplate>
  ): AnnotationTemplate {
    templateId = validateString(templateId, "templateId");

    const template = this.templates.get(templateId);
    if (!template) {
      throw new AppError(
        "TEMPLATE_NOT_FOUND",
        `Template ${templateId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    Object.assign(template, updates);
    template.updatedAt = new Date();

    return template;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): void {
    templateId = validateString(templateId, "templateId");

    if (!this.templates.has(templateId)) {
      throw new AppError(
        "TEMPLATE_NOT_FOUND",
        `Template ${templateId} not found`,
        ErrorSeverity.MEDIUM
      );
    }

    this.templates.delete(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): AnnotationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Search templates by tag
   */
  searchByTag(tag: string): AnnotationTemplate[] {
    tag = validateString(tag, "tag");

    return Array.from(this.templates.values()).filter((template) =>
      template.tags.includes(tag)
    );
  }

  /**
   * Search templates by name
   */
  searchByName(query: string): AnnotationTemplate[] {
    query = validateString(query, "query").toLowerCase();

    return Array.from(this.templates.values()).filter((template) =>
      template.name.toLowerCase().includes(query)
    );
  }

  /**
   * Export template as JSON
   */
  exportTemplate(templateId: string): string {
    const template = this.loadTemplate(templateId);
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  importTemplate(jsonString: string): AnnotationTemplate {
    try {
      const data = JSON.parse(jsonString);
      validateRequired(data.name, "name");
      validateRequired(data.layers, "layers");

      const template: AnnotationTemplate = {
        id: uuidv4(),
        name: data.name,
        description: data.description || "",
        layers: data.layers,
        defaultStyle: data.defaultStyle || this.defaultStyle,
        tags: data.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.templates.set(template.id, template);
      return template;
    } catch (error) {
      throw new AppError(
        "INVALID_TEMPLATE_JSON",
        `Failed to import template: ${(error as Error).message}`,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Duplicate template
   */
  duplicateTemplate(templateId: string, newName: string): AnnotationTemplate {
    const template = this.loadTemplate(templateId);
    newName = validateString(newName, "newName");

    return this.createTemplate(
      newName,
      template.description,
      template.layers,
      template.tags
    );
  }

  /**
   * Get template count
   */
  getTemplateCount(): number {
    return this.templates.size;
  }

  /**
   * Clear all templates
   */
  clearAllTemplates(): void {
    this.templates.clear();
  }

  /**
   * Set default style
   */
  setDefaultStyle(style: Partial<DrawingStyle>): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
  }

  /**
   * Get default style
   */
  getDefaultStyle(): DrawingStyle {
    return { ...this.defaultStyle };
  }
}
