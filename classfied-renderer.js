
class ClassifiedRenderer{
    constructor(classes) {
        this.type = 1;
        this.definition = {
            classes: classes || [
                {
                    min: 0,
                    max: 50,
                    color: [255, 255, 255, 255]
                },
                {
                    min: 50,
                    max: 100,
                    color: [0, 0, 0, 255]
                }
            ]
        }
    }
}

module.exports = ClassifiedRenderer;