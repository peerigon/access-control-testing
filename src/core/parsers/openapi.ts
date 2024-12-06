import OASNormalize from "oas-normalize";
export class OpenAPIParser {
    constructor(private specificationPath: ConstructorParameters<typeof OASNormalize>[0]) {}

    async #parseOpenAPI() {
        const oas = new OASNormalize(this.specificationPath);

        try {
            const jsonSpecification = await oas.validate();
        } catch (e) {
            // todo: add proper error handling
            console.error(e);
        }
    }

}
