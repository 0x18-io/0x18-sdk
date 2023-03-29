export default interface IModel<T> {
    save: () => Promise<boolean>;
    archive: () => Promise<boolean> | Promise<void>;
}
